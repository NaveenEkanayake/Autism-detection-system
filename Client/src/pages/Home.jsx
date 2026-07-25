import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AutismScreeningHero from "../components/herosection/HeroScreening/AutismScreeningHero";
import FeaturesCards from "../components/ui/feature-shader-cards";
import Background from "../components/3d/Background";
import LandingNav from "../components/Layout/LandingNav";
import HoverFooter from "../components/ui/hover-footer";
import { useTheme } from "../hooks/useTheme";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function Home() {
  const [activeSection, setActiveSection] = useState(0);
  const [showBg, setShowBg] = useState(false);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 70%",
        end: "bottom 20%",
        onEnter: () => {
          setActiveSection(2);
          setShowBg(true);
        },
        onEnterBack: () => {
          setActiveSection(2);
          setShowBg(true);
        },
        onLeaveBack: () => {
          setActiveSection(1);
        },
        onLeave: () => {
          setShowBg(false);
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="w-full min-h-screen antialiased selection:bg-blue-500/30 selection:text-blue-200 relative overflow-x-hidden scroll-smooth" style={{ backgroundColor: "var(--landing-bg)" }}>
      
      {/* ── CINEMATIC OVERLAYS (Fixed Global Stage) ── */}
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" 
             style={{ 
               backgroundImage: `url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>')` 
             }} 
        />
        <div className="absolute inset-0 transition-colors duration-500" style={{ background: theme === "dark" ? "radial-gradient(circle,transparent_40%,rgba(0,0,0,0.4)_100%)" : "radial-gradient(circle,transparent_40%,rgba(0,0,0,0.05)_100%)" }} />
      </div>

      {/* ── 3D BACKGROUND LAYER (Depth Anchor) ── */}
      <div
        className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000 ease-in-out"
        style={{ opacity: showBg ? 1 : 0 }}
      >
        <Background activeSection={activeSection} theme={theme} />
      </div>
      
      {/* ── LAYERED UI STACK ── */}
      <div className="relative z-10 bg-transparent">
        <LandingNav activeSection={activeSection} />
        
        {/* Hero Layer: Pinned and scaled as the next layer arrives */}
        <AutismScreeningHero 
          setActiveSection={setActiveSection}
          setShowBg={setShowBg}
        />
        
        {/* Features Layer: Slides up and over the Hero */}
        <section
          ref={sectionRef}
          id="features"
          className="relative z-20 bg-transparent w-full min-h-screen overflow-hidden"
        >
          <div className="relative z-10 bg-transparent">
            <FeaturesCards 
              headerRef={headerRef} 
              featuresRef={cardsRef} 
              sectionRef={sectionRef}
              setActiveSection={setActiveSection}
              setShowBg={setShowBg}
            />
          </div>
        </section>
        
        <HoverFooter />
      </div>
    </div>
  );
}

export default Home;
