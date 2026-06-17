import React from "react";

function AuraWatermark() {
  return (
    <div className="card-right-text gsap-reveal order-1 lg:order-3 flex flex-col items-center lg:items-end justify-center z-20 w-full select-none">
      {/* Clipped Animated Header Graphic */}
      <h2 
        className="text-4xl sm:text-5xl md:text-[6.5rem] lg:text-[8.5rem] font-black tracking-tighter text-transparent bg-clip-text animate-text-clip uppercase leading-none text-center lg:text-right"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&auto=format&fit=crop&q=80')",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}
      >
        Aura
      </h2>
      <p className="text-blue-500/70 uppercase tracking-[0.25em] text-[10px] md:text-xs font-bold mt-2 font-sans text-center lg:text-right">
        Aura Track Smart System
      </p>
    </div>
  );
}

export default AuraWatermark;