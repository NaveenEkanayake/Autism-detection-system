import React, { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Warp } from "@paper-design/shaders-react";
import { Sparkles, Zap, Puzzle, Palette, Smartphone, Cpu } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  {
    title: "AI-Powered Detection",
    description: "Advanced machine learning algorithms analyze behavioral patterns with 94.8% sensitivity for early autism screening.",
    icon: <Sparkles className="w-12 h-12" />,
  },
  {
    title: "SDQ Assessment",
    description: "Clinically validated Strengths and Difficulties Questionnaires with guided prompts for accurate parent-led screening.",
    icon: <Zap className="w-12 h-12" />,
  },
  {
    title: "Health Tracking",
    description: "Continuous monitoring of developmental milestones with real-time analytics and progress visualization.",
    icon: <Cpu className="w-12 h-12" />,
  },
  {
    title: "Report Generation",
    description: "Automated PDF reports with comprehensive charts and data visualization for clinical referrals.",
    icon: <Puzzle className="w-12 h-12" />,
  },
  {
    title: "Mobile Ready",
    description: "Fully responsive design that works seamlessly across desktop, tablet, and mobile devices.",
    icon: <Smartphone className="w-12 h-12" />,
  },
  {
    title: "Secure & Private",
    description: "HIPAA-compliant data storage with end-to-end encryption ensuring patient confidentiality.",
    icon: <Palette className="w-12 h-12" />,
  },
];

function getShaderConfig(index) {
  const configs = [
    {
      proportion: 0.3, softness: 0.8, distortion: 0.15, swirl: 0.6,
      swirlIterations: 8, shape: "checks", shapeScale: 0.08,
      colors: ["all(280, 100%, 30%)", "hsl(320, 100%, 60%)", "hsl(340, 90%, 40%)", "hsl(300, 100%, 70%)"],
    },
    {
      proportion: 0.4, softness: 1.2, distortion: 0.2, swirl: 0.9,
      swirlIterations: 12, shape: "dots", shapeScale: 0.12,
      colors: ["hsl(200, 100%, 25%)", "hsl(180, 100%, 65%)", "hsl(160, 90%, 35%)", "hsl(190, 100%, 75%)"],
    },
    {
      proportion: 0.35, softness: 0.9, distortion: 0.18, swirl: 0.7,
      swirlIterations: 10, shape: "checks", shapeScale: 0.1,
      colors: ["hsl(120, 100%, 25%)", "hsl(140, 100%, 60%)", "hsl(100, 90%, 30%)", "hsl(130, 100%, 70%)"],
    },
    {
      proportion: 0.45, softness: 1.1, distortion: 0.22, swirl: 0.8,
      swirlIterations: 15, shape: "dots", shapeScale: 0.09,
      colors: ["hsl(30, 100%, 35%)", "hsl(50, 100%, 65%)", "hsl(40, 90%, 40%)", "hsl(45, 100%, 75%)"],
    },
    {
      proportion: 0.38, softness: 0.95, distortion: 0.16, swirl: 0.85,
      swirlIterations: 11, shape: "checks", shapeScale: 0.11,
      colors: ["hsl(250, 100%, 30%)", "hsl(270, 100%, 65%)", "hsl(260, 90%, 35%)", "hsl(265, 100%, 70%)"],
    },
    {
      proportion: 0.42, softness: 1.0, distortion: 0.19, swirl: 0.75,
      swirlIterations: 9, shape: "dots", shapeScale: 0.13,
      colors: ["hsl(330, 100%, 30%)", "hsl(350, 100%, 60%)", "hsl(340, 90%, 35%)", "hsl(345, 100%, 75%)"],
    },
  ];
  return configs[index % configs.length];
}

function FeaturesCards({ headerRef, featuresRef, sectionRef, setActiveSection, setShowBg }) {
  const { theme } = useTheme();
  useEffect(() => {
    if (!sectionRef?.current) return;

    const ctx = gsap.context(() => {
      gsap.set(headerRef.current, { y: 60, opacity: 0, scale: 0.95 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "top 20%",
          scrub: 1.5,
          onEnter: () => { setActiveSection?.(2); setShowBg?.(true); },
          onEnterBack: () => { setActiveSection?.(2); setShowBg?.(true); },
          onLeaveBack: () => { setActiveSection?.(1); }
        },
      });

      tl.to(headerRef.current, {
        y: 0, opacity: 1, scale: 1, duration: 2, ease: "expo.out",
      });

      // --- Cinematic Entrance ---
      gsap.fromTo(
        ".feature-card",
        { y: 100, opacity: 0, scale: 0.9, filter: "blur(10px)" },
        {
          y: 0, opacity: 1, scale: 1, filter: "blur(0px)",
          duration: 2, stagger: 0.1, ease: "power4.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            end: "bottom bottom",
            scrub: 1,
            onLeave: () => setShowBg?.(false),
            onEnterBack: () => setShowBg?.(true)
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [headerRef, sectionRef, setActiveSection, setShowBg]);

  const isDark = theme === "dark";

  return (
    <section className="min-h-screen py-24 md:py-32 px-4 relative overflow-hidden bg-fixed bg-center bg-cover" style={{ backgroundColor: "var(--landing-bg)", backgroundImage: "url('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}>
      {/* Parallax Overlay */}
      <div className="absolute inset-0 bg-[var(--landing-bg)] opacity-80" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div ref={headerRef} className="text-center mb-16 md:mb-24">
          <span className="inline-block text-xs uppercase font-bold tracking-widest px-4 py-1.5 rounded-full border mb-6" style={{ 
            color: "var(--landing-text)", 
            backgroundColor: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)", 
            borderColor: isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)" 
          }}>
            Platform Features
          </span>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8" style={{ color: "var(--landing-text)" }}>
            Everything You Need for{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Early Detection
            </span>
          </h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: "var(--landing-text-secondary)" }}>
            Advanced AI-powered detection, evidence-based assessments, health monitoring, and clinical reporting all in one integrated platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {features.map((feature, index) => {
            const shaderConfig = getShaderConfig(index);
            return (
              <div key={index} className={`feature-card relative h-80 md:h-96 group perspective-1000`}>
                <div className="absolute inset-0 rounded-[32px] overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105">
                  <Warp
                    style={{ height: "100%", width: "100%" }}
                    proportion={shaderConfig.proportion}
                    softness={shaderConfig.softness}
                    distortion={shaderConfig.distortion}
                    swirl={shaderConfig.swirl}
                    swirlIterations={shaderConfig.swirlIterations}
                    shape={shaderConfig.shape}
                    shapeScale={shaderConfig.shapeScale}
                    scale={1}
                    rotation={0}
                    speed={0.8}
                    colors={shaderConfig.colors}
                  />
                </div>

                <div className="relative z-10 p-8 md:p-10 rounded-[32px] h-full flex flex-col backdrop-blur-xl border transition-all duration-500 group-hover:border-blue-400/50" style={{ 
                  backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.4)", 
                  borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" 
                }}>
                  <div className="mb-6 p-3 rounded-2xl w-fit shadow-inner" style={{ 
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" 
                  }}>{feature.icon}</div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: "var(--landing-text)" }}>{feature.title}</h3>
                  <p className="text-base md:text-lg leading-relaxed flex-grow opacity-90" style={{ color: "var(--landing-text-secondary)" }}>
                    {feature.description}
                  </p>
                  <div className="mt-6 flex items-center text-sm font-bold transition-all duration-300 gap-2 translate-x-0 group-hover:translate-x-2" style={{ 
                    color: isDark ? "#60a5fa" : "#2563eb",
                    transition: "color 0.3s ease"
                  }}>
                    <span>Learn more</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeaturesCards;
