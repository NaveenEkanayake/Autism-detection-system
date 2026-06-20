import React, { useRef, useState } from "react";
import { useSlideAnimation } from "./UseSlideAnimation";
import { ABOUT_SLIDES } from "./Constants";
import { useTheme } from "../../../hooks/useTheme";

function AboutUs({ embedded = false, onTimelineReady }) {
  const containerRef = useRef(null);
  const panelRef = useRef(null);
  const headerRef = useRef(null);
  const progressFillRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = ABOUT_SLIDES.length;
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useSlideAnimation(containerRef, headerRef, embedded, onTimelineReady, setActiveIndex);

  return (
    <div ref={containerRef} className={`relative w-full ${embedded ? "h-full" : ""} overflow-hidden font-sans`} style={embedded ? undefined : { height: "100vh", backgroundColor: isDark ? "#030509" : "var(--landing-bg)" }}>
      
      {/* Overlays */}
      {!embedded && (
        <>
          <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')" }} aria-hidden="true" />
          <div className="absolute inset-0 pointer-events-none z-0 opacity-20" style={{ backgroundSize: "80px 80px", backgroundImage: `linear-gradient(to right, ${isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)"} 1px, transparent 1px), linear-gradient(to bottom, ${isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)"} 1px, transparent 1px)`, maskImage: "radial-gradient(ellipse at center, black 0%, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 75%)" }} aria-hidden="true" />
        </>
      )}

      {/* Header */}
      <div ref={headerRef} className="absolute top-0 left-0 right-0 z-40 text-center pt-4 md:pt-10 pb-2 md:pb-6 px-4">
        <span className="inline-block text-[8px] md:text-[10px] uppercase font-bold tracking-[0.2em] md:tracking-[0.25em] text-blue-400 mb-2 md:mb-3 bg-blue-500/10 px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-blue-500/20">About Aura Track</span>
        <h2 className="text-lg md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-2 md:mb-4 leading-tight px-2" style={{ color: "var(--landing-text)" }}>
          Why Early Detection <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">Changes Everything</span>
        </h2>
      </div>

      {/* Slides */}
      <div ref={panelRef} className="absolute left-0 bottom-0 w-full lg:w-[58%] flex items-center justify-center px-4 md:px-10 lg:px-14" style={{ top: "clamp(100px, 16vh, 180px)", overflow: "hidden" }}>
        {ABOUT_SLIDES.map((slide, i) => {
          const Icon = slide.icon;
          return (
            <div key={slide.id} data-slide={i} className="absolute inset-0 flex flex-col lg:flex-row items-center justify-center gap-4 md:gap-10 lg:gap-16 px-4 md:px-10 lg:px-16 overflow-y-auto pb-24">
              
              {/* Image */}
              <div className="w-full lg:w-[52%] shrink-0 flex items-center justify-center">
                <div className="relative w-full max-w-[560px] aspect-[4/3] md:aspect-[16/11] rounded-xl md:rounded-3xl overflow-hidden shadow-2xl border" style={{ boxShadow: `0 25px 50px -12px rgba(0,0,0,${isDark ? "0.6" : "0.2"})`, borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                  <div className="parallax-bg absolute inset-0 will-change-transform">
                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="parallax-mid absolute inset-0 will-change-transform pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="parallax-fg w-full lg:w-[42%] max-w-lg flex flex-col justify-center will-change-transform gap-3 md:gap-6">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600/90 text-white text-[8px] md:text-[9px] font-bold uppercase tracking-[0.15em] px-2 md:px-3 py-1 md:py-1.5 rounded-md border border-blue-400/20 shadow-lg">{slide.tag} / {String(slideCount).padStart(2, "0")}</span>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 md:p-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
                      <Icon className="size-3 md:size-4" strokeWidth={2} />
                    </div>
                    <span className="text-blue-400 text-[9px] md:text-xs font-semibold uppercase tracking-widest">{slide.label}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-2 md:mb-3 leading-[1.15]" style={{ color: "var(--landing-text)" }}>{slide.title}</h3>
                  <p className="text-xs md:text-base font-light leading-relaxed" style={{ color: "var(--landing-text-secondary)" }}>{slide.description}</p>
                </div>
                <div className="w-full h-24 md:h-40 rounded-lg md:rounded-xl overflow-hidden border border-white/10 shadow-lg">
                  <img src={slide.smallImage} alt={slide.label} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="space-y-2 md:space-y-3 pt-1 md:pt-2">
                  {slide.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 md:mt-2" />
                      <p className="text-[11px] md:text-sm font-light leading-relaxed" style={{ color: "var(--landing-text-secondary)" }}>{feature}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Nav */}
      <div className="absolute right-0 bottom-0 w-[40%] z-30 hidden lg:flex flex-col justify-center px-6 md:px-10 lg:px-12 overflow-hidden" style={{ top: "clamp(130px, 20vh, 210px)" }}>
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent to-transparent" style={{ background: `linear-gradient(to bottom, transparent, ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}, transparent)` }} />
        <div className="space-y-3">
          {ABOUT_SLIDES.map((slide, i) => {
            const Icon = slide.icon;
            const isActive = i === activeIndex;
            return (
              <div key={slide.id} className={`group relative flex items-center gap-4 p-4 md:p-5 rounded-2xl border transition-all duration-700 ease-out ${isActive ? "bg-gradient-to-r from-blue-600/10 to-transparent border-blue-500/30 shadow-lg shadow-blue-600/5" : "border hover:border"}`} style={isActive ? undefined : { backgroundColor: isDark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)", borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                <div className={`shrink-0 p-2.5 rounded-xl transition-all duration-700 ${isActive ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-110" : ""}`} style={isActive ? undefined : { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: isDark ? "#525252" : "#9ca3af" }}>
                  <Icon className="size-4" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[8px] font-bold uppercase tracking-[0.2em] transition-colors duration-700 ${isActive ? "text-blue-400" : ""}`} style={isActive ? undefined : { color: isDark ? "#404040" : "#9ca3af" }}>{slide.tag}</span>
                    <span className="text-xs font-bold tracking-wide transition-colors duration-700" style={{ color: isActive ? "var(--landing-text)" : isDark ? "#6b7280" : "#9ca3af" }}>{slide.label}</span>
                  </div>
                  <p className={`text-[11px] leading-relaxed transition-all duration-700 ${isActive ? "max-h-20 opacity-100" : "max-h-8 opacity-60 line-clamp-2"}`} style={{ color: isActive ? "var(--landing-text-secondary)" : isDark ? "#404040" : "#9ca3af" }}>{slide.title}</p>
                </div>
                <div className={`shrink-0 w-1 rounded-full transition-all duration-700 ${isActive ? "h-10 bg-blue-500" : "h-3 bg-white/5"}`} />
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 h-[3px] bg-white/5 rounded-full overflow-hidden">
            <div ref={progressFillRef} className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-[width] duration-300 ease-out" style={{ width: `${((activeIndex + 1) / slideCount) * 100}%` }} />
          </div>
          <span className="text-neutral-600 text-[10px] font-mono tabular-nums">{String(activeIndex + 1).padStart(2, "0")}/{slideCount}</span>
        </div>
        <div className="mt-6 flex items-center gap-2" style={{ color: isDark ? "#525252" : "#9ca3af" }}>
          <div className="w-5 h-8 rounded-full border flex items-start justify-center p-1.5" style={{ borderColor: isDark ? "#404040" : "#d1d5db" }}>
            <div className="w-1 h-2 rounded-full animate-bounce" style={{ backgroundColor: isDark ? "#6b7280" : "#9ca3af" }} />
          </div>
          <span className="text-[10px] uppercase tracking-widest font-medium">Scroll to explore</span>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="absolute bottom-0 left-0 right-0 z-40 lg:hidden to-transparent px-4 pb-6 pt-16" style={{ background: `linear-gradient(to top, ${isDark ? "rgba(0,0,0,0.95)" : "rgba(255,255,255,0.95)"} 0%, ${isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)"} 50%, transparent 100%)` }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-[width] duration-300" style={{ width: `${((activeIndex + 1) / slideCount) * 100}%` }} />
          </div>
          <span className="text-neutral-500 text-[10px] font-mono tabular-nums">{String(activeIndex + 1).padStart(2, "0")}/{slideCount}</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          {ABOUT_SLIDES.map((slide, i) => (
            <div key={slide.id} className={`h-1.5 rounded-full transition-all duration-500 ${i === activeIndex ? "w-8 bg-blue-500" : "w-1.5 bg-white/20"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default AboutUs;
