import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AutismScreeningHero from "../components/herosection/HeroScreening/AutismScreeningHero";
import FeaturesCards from "../components/ui/feature-shader-cards";
import Background from "../components/3DBackground/Background";
import LandingNav from "../components/Herosection/LandingNav/LandingNav";
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

  // ── RE-ADDED THE CORE HOME SCROLL SYNC TRIGGER FOR THE FEATURES SECTION ──
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Create a master scroll milestone tracker explicitly for the Home layout container
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 75%", // Triggers slightly before the section fully enters the viewport
        end: "bottom 20%",
        onEnter: () => {
          setActiveSection(2); // Instantly swap Three.js camera path to index 2
          setShowBg(true);     // Fade in background canvas opacity
        },
        onEnterBack: () => {
          setActiveSection(2);
          setShowBg(true);
        },
        onLeaveBack: () => {
          setActiveSection(1); // Safely drop back to About context when scrolling up
        },
        onLeave: () => {
          setShowBg(false);    // Fade out smoothly right before entering the page footer
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="w-full min-h-screen antialiased selection:bg-blue-500/30 selection:text-blue-200" style={{ backgroundColor: "var(--landing-bg)" }}>
      
      {/* 3D Background Layer */}
      <div
        className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-700 ease-out"
        style={{ opacity: showBg ? 1 : 0 }}
      >
        <Background activeSection={activeSection} />
      </div>
      
      {/* Interactive UI Layer */}
      <div className="relative z-10 bg-transparent">
        <LandingNav activeSection={activeSection} />
        
        <AutismScreeningHero 
          setActiveSection={setActiveSection}
          setShowBg={setShowBg}
        />
        
        {/* Pass state triggers directly down to features */}
        <section
          ref={sectionRef}
          id="features"
          className="relative bg-transparent w-full min-h-screen overflow-hidden"
        >
          <div className="relative z-10 bg-transparent">
            <FeaturesCards 
              headerRef={headerRef} 
              featuresRef={cardsRef} 
              sectionRef={sectionRef} // Safely anchors sub-component references
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
