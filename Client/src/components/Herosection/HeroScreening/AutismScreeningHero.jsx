import React, { useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import DiagnosticMockup from "../PhoneText/DiagnosticMockup";
import AnimatedText from "../AnimatedShinyText/AnimatedShinyText";
import AboutUs from "../Aboutus/Aboutus";
import { ABOUT_SLIDES } from "../Aboutus/Constants";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const INJECTED_STYLES = `
  .gsap-reveal { visibility: hidden; }
  .film-grain {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 50; opacity: 0.04; mix-blend-mode: overlay;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }
  .bg-grid-theme {
      background-size: 60px 60px;
      background-image: 
          linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }
  .premium-depth-card {
      background: linear-gradient(145deg, #070d1e 0%, #040508 100%);
      box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.95), inset 0 1px 2px rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.02);
  }
  .card-sheen {
      position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
      background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(59,130,246,0.07) 0%, transparent 40%);
  }
  .iphone-bezel {
      background-color: #121214;
      box-shadow: inset 0 0 0 2px #27272A, inset 0 0 0 7px #000, 0 40px 80px -15px rgba(0,0,0,0.9);
      transform-style: preserve-3d;
  }
  .hardware-btn { background: linear-gradient(90deg, #3F3F46 0%, #18181B 100%); }
  .screen-glare { background: linear-gradient(110deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 45%); }
  .widget-depth {
      background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.003) 100%);
      border: 1px solid rgba(255,255,255,0.015);
  }
  .floating-ui-badge {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.003) 100%);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.04), 0 25px 50px -12px rgba(0, 0, 0, 0.5);
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
  setActiveSection, // Hooked state setter
  setShowBg         // Hooked state setter
}) {
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
            rotationY: xVal * 10,
            rotationX: -yVal * 10,
            ease: "power3.out",
            duration: 1.2,
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
      /* ── Initial States ── */
      gsap.set(".text-track", { autoAlpha: 0, y: 60, scale: 0.9, filter: "blur(20px)" });
      gsap.set(".text-days", { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" });
      gsap.set(".main-card", { y: window.innerHeight + 200, autoAlpha: 1 });
      gsap.set([".card-left-text", ".card-right-text", ".mockup-scroll-wrapper", ".floating-badge", ".phone-widget"], { autoAlpha: 0 });
      gsap.set(".about-carousel-wrapper", { y: window.innerHeight, autoAlpha: 0 });

      /* ── Entrance Sequence ── */
      const introTl = gsap.timeline({ delay: 0.2 });
      introTl
        .to(".text-track", { duration: 1.5, autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", ease: "expo.out" })
        .to(".text-days", { duration: 1.2, clipPath: "inset(0 0% 0 0)", ease: "power4.inOut" }, "-=0.8");

      /* ── Master Scroll Timeline ── */
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: () => `+=${HERO_PHASE_UNITS * 1000 + CAROUSEL_SCROLL_PX}`,
          pin: true,
          scrub: 1.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const progress = self.progress;

            // ── COORDINATING UNIFIED BACKGROUND STATES ACCORDING TO TIMELINE REACH ──
            if (progress < 0.38) {
              // Phase 0: Pinned Dashboard Mockup active
              setActiveSection?.(0);
              setShowBg?.(false);
            } else if (progress >= 0.38 && progress < 0.95) {
              // Phase 1: Carousel Slides active -> Trigger 3D Backdrop Viewport
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
        /* ── Phase A: Hero content reveal ── */
        .to(".hero-text-wrapper", { opacity: 0.3, ease: "power1.inOut", duration: 2 }, 0)
        .to(".main-card", { y: 0, ease: "power3.inOut", duration: 2 }, 0)
        .to(".main-card", { width: "100%", height: "100%", borderRadius: "0px", ease: "power2.inOut", duration: 1.5 })
        .fromTo(".mockup-scroll-wrapper",
          { y: 250, autoAlpha: 0, scale: 0.7 },
          { y: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 2.5 }, "-=0.8"
        )
        .fromTo(".phone-widget", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.12, ease: "back.out(1.2)", duration: 1.2 }, "-=1.5")
        .to(".progress-ring", { strokeDashoffset: 0, duration: 2, ease: "power3.inOut" }, "-=1.2")
        .to(".counter-val", { innerHTML: metricValue, snap: { innerHTML: 0.1 }, duration: 2, ease: "expo.out" }, "-=2.0")
        .fromTo(".floating-badge", { y: 80, autoAlpha: 0, scale: 0.8 }, { y: 0, autoAlpha: 1, scale: 1, ease: "back.out(1.2)", duration: 1.2, stagger: 0.15 }, "-=1.8")
        .fromTo(".card-left-text", { x: -40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power4.out", duration: 1.5 }, "-=1.5")
        .fromTo(".card-right-text", { x: 40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "expo.out", duration: 1.5 }, "<")

        /* ── Hold ── */
        .to({}, { duration: 2 })

        /* ── Phase B: Exit hero content, reveal carousel ── */
        .to([".mockup-scroll-wrapper", ".floating-badge", ".card-left-text", ".card-right-text"], {
          scale: 0.95, y: -20, autoAlpha: 0, ease: "power2.in", duration: 1.2,
        })
        .to(".main-card", {
          y: -window.innerHeight - 100, opacity: 0, ease: "power2.inOut", duration: 2,
        }, "-=0.8")
        .to(".hero-text-wrapper", { y: -200, autoAlpha: 0, ease: "power2.inOut", duration: 1.5 }, "<")

        /* ── Phase C: Carousel slides up into view ── */
        .to(".about-carousel-wrapper", {
          y: 0, autoAlpha: 1, ease: "power3.out", duration: 2.5,
        }, "-=1.5")

        /* ── Phase D & E: Holds ── */
        .to({}, { duration: CAROUSEL_SLIDES * 2 + 3 })
        .to({}, { duration: 3 });

    }, containerRef);

    return () => ctx.revert();
  }, [metricValue, setActiveSection, setShowBg]);

  return (
    <div
      id="hero-section"
      ref={containerRef}
      className="relative w-full overflow-hidden bg-transparent text-white font-sans antialiased"
      style={{ perspective: "1500px" }}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="film-grain" aria-hidden="true" />

      {/* ── HERO VIEWPORT PLANE ── */}
      <div className="relative w-full h-screen overflow-hidden" style={{ perspective: "1500px" }}>
        <div className="hero-text-wrapper absolute z-10 inset-0 flex flex-col items-center justify-center text-center w-screen px-4 will-change-transform">
          <div className="text-track gsap-reveal">
            <AnimatedText
              text="Advanced Pediatric Tracking"
              textClassName="text-[1.4rem] sm:text-[2rem] md:text-[3rem] lg:text-[4.5rem] font-bold tracking-tight text-white drop-shadow-md py-2"
              gradientColors="linear-gradient(90deg, #4b5563, #ffffff, #4b5563)"
            />
          </div>
          <div className="text-days gsap-reveal mt-[-10px] md:mt-[-20px]">
            <AnimatedText
              text="AURA TRACK ENGINE"
              textClassName="text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5.5rem] font-black tracking-tighter"
              gradientColors="linear-gradient(90deg, #1d4ed8, #60a5fa, #1d4ed8)"
            />
          </div>
        </div>

        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ perspective: "1500px" }}>
          <div
            ref={mainCardRef}
            className="main-card premium-depth-card relative overflow-hidden gsap-reveal flex items-center justify-center pointer-events-auto w-[94vw] md:w-[85vw] h-[94vh] md:h-[85vh] rounded-[24px] md:rounded-[36px]"
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

      {/* ── ABOUT SECTION VIEWPORT PLANE ── */}
      {/* Stripped inline visibility styles to let autoAlpha process properly */}
      <div id="about" className="about-carousel-wrapper absolute inset-0 z-30 bg-transparent">
        <AboutUs embedded onTimelineReady={handleTimelineReady} />
      </div>
    </div>
  );
}

export default AutismScreeningHero;
