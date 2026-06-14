import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AutismScreeningHero from "../components/herosection/HeroScreening/AutismScreeningHero";
import FeaturesCards from "../components/ui/feature-shader-cards";
import Background from "../components/3DBackground/Background";
import LandingNav from "../components/Herosection/LandingNav/LandingNav";
import HoverFooter from "../components/ui/hover-footer";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function Home() {
  const [activeSection, setActiveSection] = useState(0);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    const sections = document.querySelectorAll("section[id], div[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id === "hero-section") setActiveSection(0);
            else if (id === "about") setActiveSection(1);
            else if (id === "features") setActiveSection(2);
          }
        });
      },
      { threshold: 0.15, rootMargin: "-100px 0px -50px 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".features-bg", { opacity: 0 });
      gsap.set(headerRef.current, { y: 60, opacity: 0 });
      gsap.set(cardsRef.current, { y: 80, opacity: 0 });

      gsap.to(".features-bg", {
        opacity: 1, duration: 2.5, ease: "expo.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "top 15%",
          scrub: 2,
        },
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          end: "top 10%",
          scrub: 2,
        },
      });

      tl.to(headerRef.current, {
        y: 0, opacity: 1, duration: 2, ease: "expo.out",
      }).to(cardsRef.current, {
        y: 0, opacity: 1, duration: 2.5, ease: "expo.out",
      }, "-=1");

      gsap.fromTo(
        ".feature-card",
        { y: 80, opacity: 0, scale: 0.93 },
        {
          y: 0, opacity: 1, scale: 1,
          duration: 2, stagger: 0.15, ease: "expo.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            end: "bottom bottom",
            scrub: 2,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="w-full min-h-screen bg-neutral-950 antialiased selection:bg-blue-500/30 selection:text-blue-200">
      <div className="relative z-10">
        <LandingNav activeSection={activeSection} />
        <AutismScreeningHero />
        <section
          ref={sectionRef}
          id="features"
          className="relative bg-neutral-950 w-full min-h-screen overflow-hidden"
        >
          <div className="features-bg absolute inset-0 pointer-events-none">
            <Background />
          </div>
          <div className="relative z-10">
            <FeaturesCards headerRef={headerRef} featuresRef={cardsRef} />
          </div>
        </section>
        <HoverFooter />
      </div>
    </div>
  );
}

export default Home;
