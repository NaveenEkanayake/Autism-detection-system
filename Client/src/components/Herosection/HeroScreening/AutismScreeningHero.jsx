import React, { useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import DiagnosticMockup from "../PhoneText/DiagnosticMockup";
import AnimatedText from "../AnimatedShinyText/AnimatedShinyText";
import AboutUs from "../Aboutus/Aboutus";
import { ABOUT_SLIDES } from "../Aboutus/Constants";
import { useTheme } from "../../../hooks/useTheme";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const INJECTED_STYLES = `
  .gsap-reveal { visibility: hidden; }
  .film-grain {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 100; opacity: 0.03; mix-blend-mode: overlay;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }
  .cinematic-vignette {
      position: absolute; inset: 0; pointer-events: none; z-index: 90;
  }
  .bg-grid-theme-dark {
      background-size: 60px 60px;
      background-image: 
          linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }
  .bg-grid-theme-light {
      background-size: 60px 60px;
      background-image: 
          linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }
  .premium-depth-card {
      background: var(--landing-card);
      box-shadow: var(--landing-card-shadow), 0 0 100px rgba(0,0,0,0.3);
      border: 1px solid var(--landing-card-border);
      backdrop-filter: blur(10px);
  }
  .card-sheen {
      position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
      background: radial-gradient(1000px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(59,130,246,0.12) 0%, transparent 50%);
  }
  .iphone-bezel {
      background-color: var(--landing-bezel);
      box-shadow: var(--landing-bezel-shadow);
      transform-style: preserve-3d;
  }
  .hardware-btn { background: linear-gradient(90deg, #3F3F46 0%, #18181B 100%); }
  .screen-glare { background: linear-gradient(110deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 45%); }
  .widget-depth {
      background: var(--landing-widget-bg);
      border: 1px solid var(--landing-widget-border);
  }
  .floating-ui-badge {
      background: var(--landing-badge-bg);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 0 0 1px var(--landing-badge-border), 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  }
  .progress-ring {
      transform: rotate(-90deg); transform-origin: center;
      stroke-dasharray: 402; stroke-dashoffset: 402; stroke-linecap: round;
  }
`;

function AutismScreeningHero({
  cardHeading = "Intelligent Risk Assessment Engine",
  cardDescription = "Aura Track utilizes an automated multi-modal screening pipeline specifically calibrated for early pediatric cohorts aged 3 to 5 years...",
  metricValue = 94.8,
  metricLabel = "Model Sensitivity Index (%)",
  setActiveSection,
  setShowBg
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const containerRef = useRef(null);
  const mainCardRef = useRef(null);
  const mockupRef = useRef(null);
  const requestRef = useRef(0);
  const carouselTlRef = useRef(null);

  const CAROUSEL_SLIDES = ABOUT_SLIDES.length;
  const CAROUSEL_SCROLL_PX = CAROUSEL_SLIDES * window.innerHeight;
  const HERO_PHASE_UNITS = 12;

  const handleTimelineReady = useCallback((tl) => {
    carouselTlRef.current = tl;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.scrollY > window.innerHeight * 3) return;

      cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(() => {
        if (mainCardRef.current && mockupRef.current) {
          const rect = mainCardRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          mainCardRef.current.style.setProperty("--mouse-x", `${mouseX}px`);
          mainCardRef.current.style.setProperty("--mouse-y", `${mouseY}px`);

          const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;

          gsap.to(mockupRef.current, {
            rotationY: xVal * 12,
            rotationX: -yVal * 12,
            ease: "power3.out",
            duration: 1.5,
          });
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* ── CINEMATIC INITIAL STATES ── */
      gsap.set(".text-track", { autoAlpha: 0, y: 100, scale: 0.8, filter: "blur(30px)" });
      gsap.set(".text-days", { autoAlpha: 0, scale: 0.9, clipPath: "inset(0 100% 0 0)" });
      gsap.set(".main-card", { y: window.innerHeight * 0.8, scale: 0.6, autoAlpha: 0 });
      gsap.set([".card-left-text", ".card-right-text", ".mockup-scroll-wrapper", ".floating-badge", ".phone-widget"], { autoAlpha: 0 });
      gsap.set(".about-carousel-wrapper", { y: window.innerHeight, autoAlpha: 0 });

      const introTl = gsap.timeline({ delay: 0.5 });
      introTl
        .to(".text-track", { duration: 2, autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", ease: "expo.out" })
        .to(".text-days", { duration: 1.5, autoAlpha: 1, scale: 1, clipPath: "inset(0 0% 0 0)", ease: "power4.inOut" }, "-=1.2")
        .to(".main-card", { duration: 2.5, autoAlpha: 1, y: 0, scale: 1, ease: "expo.out" }, "-=1");

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: () => `+=${HERO_PHASE_UNITS * 1000 + CAROUSEL_SCROLL_PX}`,
          pin: true,
          scrub: 2,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const progress = self.progress;

            if (progress < 0.38) {
              setActiveSection?.(0);
              setShowBg?.(false);
            } else if (progress >= 0.38 && progress < 0.95) {
              setActiveSection?.(1);
              setShowBg?.(true);
            }

            const tl = carouselTlRef.current;
            if (!tl) return;
            const tlDuration = tl.duration();
            if (tlDuration <= 0) return;

            const totalDuration = self.animation.duration();
            const carouselStartTime = totalDuration - tlDuration;
            const currentTime = progress * totalDuration;
            const carouselProgress = Math.max(0, Math.min(1,
              (currentTime - carouselStartTime) / tlDuration
            ));
            tl.progress(carouselProgress);
            const aboutEl = document.getElementById("about");
            if (aboutEl) {
              aboutEl.dataset.aboutActive = String(carouselProgress > 0);
            }
          },
        },
      });

      scrollTl
        /* ── PARALLAX LAYER REVEAL ── */
        .to(".hero-text-wrapper", { y: -200, autoAlpha: 0.2, ease: "power1.inOut", duration: 2 }, 0)
        .to(".main-card", { width: "100%", height: "100%", borderRadius: "0px", ease: "power2.inOut", duration: 2 }, 0.5)
        .fromTo(".mockup-scroll-wrapper",
          { y: 300, autoAlpha: 0, scale: 0.6 },
          { y: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 3 }, "-=1"
        )
        .fromTo(".phone-widget", { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.15, ease: "back.out(1.5)", duration: 1.5 }, "-=2")
        .to(".progress-ring", { strokeDashoffset: 0, duration: 2.5, ease: "power3.inOut" }, "-=1.5")
        .to(".counter-val", { innerHTML: metricValue, snap: { innerHTML: 0.1 }, duration: 2.5, ease: "expo.out" }, "-=2.5")
        .fromTo(".floating-badge", { y: 100, autoAlpha: 0, scale: 0.7 }, { y: 0, autoAlpha: 1, scale: 1, ease: "back.out(1.5)", duration: 1.5, stagger: 0.2 }, "-=2")
        .fromTo(".card-left-text", { x: -60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power4.out", duration: 2 }, "-=2")
        .fromTo(".card-right-text", { x: 60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "expo.out", duration: 2 }, "<")

        .to({}, { duration: 2 })

        /* ── LAYER TRANSITION (Sinking Effect) ── */
        .to([".mockup-scroll-wrapper", ".floating-badge", ".card-left-text", ".card-right-text"], {
          scale: 0.8, y: -50, autoAlpha: 0, ease: "power2.in", duration: 1.5,
        })
        .to(".main-card", {
          scale: 0.85, opacity: 0, y: -100, ease: "power2.inOut", duration: 2,
        }, "-=1")
        .to(".hero-text-wrapper", { y: -400, autoAlpha: 0, ease: "power2.inOut", duration: 2 }, "<")

        /* ── LAYER TRANSITION (Next Section Slides Over) ── */
        .to(".about-carousel-wrapper", {
          y: 0, autoAlpha: 1, scale: 1, ease: "power3.out", duration: 3,
        }, "-=2")

        .to({}, { duration: CAROUSEL_SLIDES * 2 + 3 })
        .to({}, { duration: 3 });

    }, containerRef);

    return () => ctx.revert();
  }, [metricValue, setActiveSection, setShowBg]);

  return (
    <div
      id="hero-section"
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-transparent font-sans antialiased ${isDark ? "text-white" : "text-gray-900"}`}
      style={{ perspective: "2000px" }}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="film-grain" aria-hidden="true" />
      <div className="cinematic-vignette" aria-hidden="true" style={{ background: isDark ? "radial-gradient(circle, transparent 40%, rgba(0,0,0,0.4) 100%)" : "radial-gradient(circle, transparent 40%, rgba(0,0,0,0.05) 100%)" }} />

      <div className="relative w-full h-screen overflow-hidden" style={{ perspective: "2000px" }}>
        <div className="hero-text-wrapper absolute z-10 inset-0 flex flex-col items-center justify-center text-center w-screen px-4 will-change-transform">
          <div className="text-track gsap-reveal">
            <AnimatedText
              text="Advanced Pediatric Tracking"
              textClassName={`text-[1.6rem] sm:text-[2.2rem] md:text-[3.2rem] lg:text-[4.8rem] font-bold tracking-tight drop-shadow-2xl py-2 ${isDark ? "text-white" : "text-gray-900"}`}
              gradientColors="linear-gradient(90deg, #6b7280, #ffffff, #6b7280)"
            />
          </div>
          <div className="text-days gsap-reveal mt-[-15px] md:mt-[-25px]">
            <AnimatedText
              text="AURA TRACK ENGINE"
              textClassName="text-[2.8rem] sm:text-[3.8rem] md:text-[4.8rem] lg:text-[6rem] font-black tracking-tighter"
              gradientColors="linear-gradient(90deg, #1e40af, #60a5fa, #1e40af)"
            />
          </div>
        </div>

        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ perspective: "2000px" }}>
          <div
            ref={mainCardRef}
            className="main-card premium-depth-card relative overflow-hidden gsap-reveal flex items-center justify-center pointer-events-auto w-[92vw] md:w-[80vw] h-[92vh] md:h-[80vh] rounded-[32px] md:rounded-[48px] will-change-transform"
          >
            <div className="card-sheen" aria-hidden="true" />
            <DiagnosticMockup
              mockupRef={mockupRef}
              metricLabel={metricLabel}
              cardHeading={cardHeading}
              cardDescription={cardDescription}
            />
          </div>
        </div>
      </div>

      <div id="about" className="about-carousel-wrapper absolute inset-0 z-30 bg-transparent">
        <AboutUs embedded onTimelineReady={handleTimelineReady} />
      </div>
    </div>
  );
}

export default AutismScreeningHero;
