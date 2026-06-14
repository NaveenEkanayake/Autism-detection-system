import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ABOUT_SLIDES, LAYER_VECTORS, SCRUB_SMOOTHING } from "./Constants";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const useSlideAnimation = (containerRef, headerRef, embedded, onTimelineReady, onActiveIndexChange) => {
  const timelineRef = useRef(null);
  const scrollTriggerRef = useRef(null);

  const buildTimeline = () => {
    const v = LAYER_VECTORS;
    const tl = gsap.timeline({ paused: true });
    const slideCount = ABOUT_SLIDES.length;

    tl.to(headerRef.current, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: "expo.out" }, 0);
    tl.to({}, { duration: 0.6 }, 0.8);
    tl.to(headerRef.current, { autoAlpha: 0, y: -40, scale: 0.95, duration: 0.5, ease: "power2.in" }, 1.4);

    // Slide 0
    tl.fromTo('[data-slide="0"]', { autoAlpha: 0, scale: 0.97 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "power3.out" }, 1.7);
    tl.fromTo('[data-slide="0"] .parallax-bg', { ...v.bgLayer.enter }, { ...v.bgLayer.active, duration: 1.2, ease: "expo.out" }, 1.7);
    tl.fromTo('[data-slide="0"] .parallax-mid', { ...v.midLayer.enter }, { ...v.midLayer.active, duration: 0.9, ease: "power2.out" }, 1.8);
    tl.fromTo('[data-slide="0"] .parallax-fg', { ...v.fgLayer.enter }, { ...v.fgLayer.active, duration: 1.2, ease: "expo.out" }, 1.9);

    tl.to('[data-slide="0"] .parallax-bg', { ...v.bgLayer.exit, duration: 0.8, ease: "power2.inOut" }, 2.8);
    tl.to('[data-slide="0"] .parallax-mid', { ...v.midLayer.exit, duration: 0.6, ease: "power2.inOut" }, 2.9);
    tl.to('[data-slide="0"] .parallax-fg', { ...v.fgLayer.exit, duration: 0.7, ease: "power3.inOut" }, 2.9);
    tl.to('[data-slide="0"]', { autoAlpha: 0, scale: 0.97, duration: 0.4, ease: "power2.inOut" }, 3.2);

    // Slides 1+
    for (let i = 1; i < slideCount; i++) {
      const segStart = 3.6 + (i - 1) * 1.8;
      tl.fromTo(`[data-slide="${i}"]`, { autoAlpha: 0, scale: 0.97 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power3.out" }, segStart);
      tl.fromTo(`[data-slide="${i}"] .parallax-bg`, { ...v.bgLayer.enter }, { ...v.bgLayer.active, duration: 1.0, ease: "expo.out" }, segStart);
      tl.fromTo(`[data-slide="${i}"] .parallax-mid`, { ...v.midLayer.enter }, { ...v.midLayer.active, duration: 0.8, ease: "power2.out" }, segStart + 0.05);
      tl.fromTo(`[data-slide="${i}"] .parallax-fg`, { ...v.fgLayer.enter }, { ...v.fgLayer.active, duration: 1.1, ease: "expo.out" }, segStart + 0.1);

      const exitStart = segStart + 0.8;
      tl.to(`[data-slide="${i}"] .parallax-bg`, { ...(i < slideCount - 1 ? v.bgLayer.exit : { scale: 1.08, y: -30, opacity: 0 }), duration: 0.7, ease: "power2.inOut" }, exitStart);
      tl.to(`[data-slide="${i}"] .parallax-mid`, { ...v.midLayer.exit, duration: 0.5, ease: "power2.inOut" }, exitStart + 0.05);
      tl.to(`[data-slide="${i}"] .parallax-fg`, { ...(i < slideCount - 1 ? v.fgLayer.exit : { y: -35, opacity: 0 }), duration: 0.6, ease: "power3.inOut" }, exitStart + 0.05);
      if (i < slideCount - 1) tl.to(`[data-slide="${i}"]`, { autoAlpha: 0, scale: 0.97, duration: 0.3 }, exitStart + 0.7);
    }

    tl.to({}, { duration: 0.5 });
    return tl;
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(headerRef.current, { autoAlpha: 0, y: 40, scale: 0.95 });
      ABOUT_SLIDES.forEach((_, i) => {
        gsap.set(`[data-slide="${i}"]`, { autoAlpha: 0, visibility: "hidden" });
        gsap.set(`[data-slide="${i}"] .parallax-bg`, { ...LAYER_VECTORS.bgLayer.enter });
        gsap.set(`[data-slide="${i}"] .parallax-mid`, { ...LAYER_VECTORS.midLayer.enter });
        gsap.set(`[data-slide="${i}"] .parallax-fg`, { ...LAYER_VECTORS.fgLayer.enter });
      });

      const tl = buildTimeline();
      timelineRef.current = tl;

      if (embedded) {
        if (onTimelineReady) onTimelineReady(tl);
      } else {
        const trigger = ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top top",
          end: () => `+=${window.innerHeight * 8}`,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: SCRUB_SMOOTHING,
          onUpdate: (self) => tl.progress(self.progress),
        });
        scrollTriggerRef.current = trigger;
      }
    }, containerRef);

    return () => {
      if (scrollTriggerRef.current) scrollTriggerRef.current.kill();
      if (timelineRef.current) timelineRef.current.kill();
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    let prevIndex = -1;
    const ticker = () => {
      const tl = timelineRef.current;
      if (!tl || tl.duration() <= 0) return;
      const progress = tl.progress();
      const currentTime = progress * tl.duration();
      let idx = 0;
      if (currentTime < 1.7) idx = -1;
      else if (currentTime < 3.6) idx = 0;
      else {
        const slidePhase = (currentTime - 3.6) / 1.8;
        idx = Math.min(Math.floor(slidePhase) + 1, ABOUT_SLIDES.length - 1);
      }
      idx = Math.max(idx, 0);
      if (idx !== prevIndex && idx < ABOUT_SLIDES.length) {
        prevIndex = idx;
        onActiveIndexChange(idx);
      }
    };
    gsap.ticker.add(ticker);
    return () => gsap.ticker.remove(ticker);
  }, []);
};