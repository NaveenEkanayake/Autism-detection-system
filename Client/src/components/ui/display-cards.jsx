"use client";

import React, { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { Sparkles, Brain, Eye, EyeOff } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ── INDIVIDUAL SUB-CARD COMPONENT ──
function DisplayCard({
  className,
  icon = <Sparkles className="size-4 text-blue-300" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  titleClassName = "text-blue-400",
}) {
  return (
    <div
      className={cn(
        "relative flex h-36 w-[80vw] max-w-[22rem] -skew-y-[8deg] select-none flex-col justify-between rounded-xl border-2 border-white/5 bg-neutral-900/40 backdrop-blur-md px-4 py-3 transition-all duration-700 after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-gradient-to-l after:from-neutral-950/20 after:to-transparent after:content-[''] hover:border-blue-500/30 hover:bg-neutral-900/60 [&>*]:flex [&>*]:items-center [&>*]:gap-2",
        className
      )}
    >
      <div>
        <span className="relative inline-block rounded-full bg-blue-950 border border-blue-500/20 p-1.5">
          {icon}
        </span>
        <p className={cn("text-lg font-semibold tracking-tight", titleClassName)}>{title}</p>
      </div>
      <p className="whitespace-nowrap text-base text-neutral-200">{description}</p>
      <p className="text-xs text-neutral-400 font-mono tracking-wider uppercase">{date}</p>
    </div>
  );
}

// ── MAIN EXPORT: FEATURES SHADER CARDS VIEWPORT OVERLAY ──
function FeaturesCards({ 
  headerRef, 
  featuresRef, 
  sectionRef,
  setActiveSection,
  setShowBg 
}) {

  useEffect(() => {
    if (!sectionRef?.current) return;

    const ctx = gsap.context(() => {
      // Establish clean baseline layout positions before scrub execution
      gsap.set(headerRef.current, { y: 60, opacity: 0 });
      gsap.set(featuresRef.current, { y: 80, opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          end: "top 10%",
          scrub: 2,
          // ── ORCHESTRATING THREE.JS STATE ROUTING OVERLAY ──
          onEnter: () => {
            setActiveSection?.(2); // Direct camera to point at Features target (Index 2)
            setShowBg?.(true);     // Turn background layer opacity on
          },
          onEnterBack: () => {
            setActiveSection?.(2);
            setShowBg?.(true);
          },
          onLeaveBack: () => {
            setActiveSection?.(1); // Return cleanly to About Us section framing (Index 1)
          }
        },
      });

      tl.to(headerRef.current, {
        y: 0, opacity: 1, duration: 2, ease: "expo.out",
      }).to(featuresRef.current, {
        y: 0, opacity: 1, duration: 2.5, ease: "expo.out",
      }, "-=1");

      // Animate card entries smoothly inside the responsive grid container
      gsap.fromTo(
        ".feature-card-wrapper > div",
        { y: 80, opacity: 0, scale: 0.93 },
        {
          y: 0, opacity: 1, scale: 1,
          duration: 2, stagger: 0.15, ease: "expo.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            end: "bottom bottom",
            scrub: 2,
            // Gracefully kill backdrop canvas transparency before encountering the page footer
            onLeave: () => setShowBg?.(false),
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [sectionRef, headerRef, featuresRef, setActiveSection, setShowBg]);

  // High-precision custom pipeline props loaded straight into your original layout template
  const localizedData = [
    {
      title: "Computer Vision",
      description: "Head-eye telemetry arrays",
      date: "Pipeline: Active",
      icon: <Eye className="size-4 text-blue-400" />,
      className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-neutral-950/40 grayscale hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      title: "Biomarker Indexing",
      description: "Multi-modal cross matching",
      date: "Engine: Calibrated",
      icon: <Brain className="size-4 text-indigo-400" />,
      titleClassName: "text-indigo-400",
      className: "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-neutral-950/40 grayscale hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      title: "Telemetry Sync",
      description: "Real-time configuration logging",
      date: "Telemetry: Online",
      icon: <Sparkles className="size-4 text-cyan-400" />,
      titleClassName: "text-cyan-400",
      className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
    },
  ];

  return (
    /* CRITICAL: Changed from solid bg-neutral-950 to bg-transparent */
    <div className="w-full min-h-screen bg-transparent py-32 text-white relative flex flex-col justify-center items-center gap-16 overflow-hidden">
      
      {/* HEADER SECTION LAYOUT OVERLAY */}
      <div ref={headerRef} className="max-w-4xl mx-auto text-center px-6 pointer-events-auto">
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">
          Engine Specifications
        </h2>
        <p className="text-neutral-400 mt-4 text-base md:text-lg max-w-xl mx-auto font-medium">
          Automated multi-modal monitoring tracking system, precision-engineered across concurrent diagnostics metrics.
        </p>
      </div>
      
      {/* SKIPPED INTERSTACK DISPLAY CARDS CONTAINER */}
      <div 
        ref={featuresRef} 
        className="feature-card-wrapper w-full max-w-lg min-h-[350px] relative mt-12 flex justify-center items-center pointer-events-auto"
      >
        <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700 pr-32">
          {localizedData.map((cardProps, index) => (
            <DisplayCard key={index} {...cardProps} />
          ))}
        </div>
      </div>

    </div>
  );
}

export default FeaturesCards;