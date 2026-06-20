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
    icon: <Sparkles className="w-12 h-12 text-white" />,
  },
  {
    title: "SDQ Assessment",
    description: "Clinically validated Strengths and Difficulties Questionnaires with guided prompts for accurate parent-led screening.",
    icon: <Zap className="w-12 h-12 text-white" />,
  },
  {
    title: "Health Tracking",
    description: "Continuous monitoring of developmental milestones with real-time analytics and progress visualization.",
    icon: <Cpu className="w-12 h-12 text-white" />,
  },
  {
    title: "Report Generation",
    description: "Automated PDF reports with comprehensive charts and data visualization for clinical referrals.",
    icon: <Puzzle className="w-12 h-12 text-white" />,
  },
  {
    title: "Mobile Ready",
    description: "Fully responsive design that works seamlessly across desktop, tablet, and mobile devices.",
    icon: <Smartphone className="w-12 h-12 text-white" />,
  },
  {
    title: "Secure & Private",
    description: "HIPAA-compliant data storage with end-to-end encryption ensuring patient confidentiality.",
    icon: <Palette className="w-12 h-12 text-white" />,
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
      gsap.set(headerRef.current, { y: 60, opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "top 20%",
          scrub: 2,
          onEnter: () => { setActiveSection?.(2); setShowBg?.(true); },
          onEnterBack: () => { setActiveSection?.(2); setShowBg?.(true); },
          onLeaveBack: () => { setActiveSection?.(1); }
        },
      });

      tl.to(headerRef.current, {
        y: 0, opacity: 1, duration: 2, ease: "expo.out",
      });

      gsap.fromTo(
        ".feature-card",
        { y: 80, opacity: 0, scale: 0.93 },
        {
          y: 0, opacity: 1, scale: 1,
          duration: 2, stagger: 0.15, ease: "expo.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            end: "bottom bottom",
            scrub: 2,
            onLeave: () => setShowBg?.(false),
            onEnterBack: () => setShowBg?.(true)
          },
        }
      );

      gsap.fromTo(
        ".feature-card",
        { y: 80, opacity: 0, scale: 0.93 },
        {
          y: 0, opacity: 1, scale: 1,
          duration: 2, stagger: 0.15, ease: "expo.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            end: "bottom bottom",
            scrub: 2,
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
    <section className="min-h-screen py-16 md:py-20 px-4" style={{ backgroundColor: "var(--landing-bg)" }}>
      <div className="max-w-7xl mx-auto">
        <div ref={headerRef} className="text-center mb-12 md:mb-16">
          <span className="inline-block text-xs uppercase font-bold tracking-widest text-blue-400 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20 mb-6">
            Platform Features
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6" style={{ color: "var(--landing-text)" }}>
            Everything You Need for{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Early Detection
            </span>
          </h2>
          <p className="text-lg max-w-3xl mx-auto leading-relaxed" style={{ color: "var(--landing-text-secondary)" }}>
            Advanced AI-powered detection, evidence-based assessments, health monitoring, and clinical reporting all in one integrated platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => {
            const shaderConfig = getShaderConfig(index);
            return (
              <div key={index} className="feature-card relative h-72 md:h-80 group">
                <div className="absolute inset-0 rounded-3xl overflow-hidden">
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

                <div className="relative z-10 p-6 md:p-8 rounded-3xl h-full flex flex-col backdrop-blur-sm border transition-all duration-500" style={{ 
                  backgroundColor: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)", 
                  borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" 
                }}>
                  <div className="mb-4 md:mb-6">{feature.icon}</div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3" style={{ color: "var(--landing-text)" }}>{feature.title}</h3>
                  <p className="text-sm md:text-base leading-relaxed flex-grow" style={{ color: "var(--landing-text-secondary)" }}>
                    {feature.description}
                  </p>
                  <div className="mt-4 md:mt-6 flex items-center text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                    <span className="mr-2">Learn more</span>
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