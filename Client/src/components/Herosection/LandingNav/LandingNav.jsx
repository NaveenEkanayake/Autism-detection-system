import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain } from "lucide-react";

function MenuIcon({ open }) {
  return (
    <div className="relative w-5 h-5 flex items-center justify-center">
      <motion.span
        className="absolute h-[2px] w-5 bg-white rounded-full"
        animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -5 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute h-[2px] w-5 bg-white rounded-full"
        animate={open ? { opacity: 0, x: 10 } : { opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.span
        className="absolute h-[2px] w-5 bg-white rounded-full"
        animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 5 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
    </div>
  );
}

function LandingNav({ activeSection = 0 }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { id: 0, label: "Home", href: "#hero-section" },
    { id: 1, label: "About Us", href: "#about" },
    { id: 2, label: "Features", href: "#features" },
  ];

  const scrollToSection = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileOpen(false);
  };

  return (
    <>
      {/* Desktop Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 hidden md:block">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="#hero-section" onClick={(e) => scrollToSection(e, "#hero-section")} className="flex items-center gap-2 text-white">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
                <Brain className="size-5" strokeWidth={2} />
              </div>
              <span className="text-sm font-bold tracking-tight">
                Aura<span className="text-blue-400">Track</span>
              </span>
            </a>

            {/* Nav links */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-lg">
              {navLinks.map((link, i) => {
                const isActive = activeSection === link.id;
                const isLast = i === navLinks.length - 1;
                return (
                  <React.Fragment key={link.id}>
                    <a
                      href={link.href}
                      onClick={(e) => scrollToSection(e, link.href)}
                      className={`relative text-[11px] font-bold tracking-widest uppercase transition-all duration-500 px-3 py-1.5 rounded-lg ${
                        isActive
                          ? "text-blue-400 bg-blue-500/10"
                          : "text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      {link.label}
                      {isActive && (
                        <motion.div
                          layoutId="active-nav-line"
                          className="absolute bottom-0 left-2 right-2 h-[2px] bg-blue-500 rounded-full shadow-[0_0_6px_rgba(59,130,246,0.5)]"
                          transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        />
                      )}
                    </a>
                    {!isLast && <span className="w-px h-3 bg-white/5" />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 md:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <a href="#hero-section" onClick={(e) => scrollToSection(e, "#hero-section")} className="flex items-center gap-2 text-white">
            <div className="p-1 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
              <Brain className="size-4" strokeWidth={2} />
            </div>
            <span className="text-xs font-bold tracking-tight">
              Aura<span className="text-blue-400">Track</span>
            </span>
          </a>

          <button
            className="relative w-9 h-9 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] flex items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>
      </nav>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden flex flex-col items-center justify-center bg-neutral-950/95 backdrop-blur-2xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <nav className="flex flex-col items-center gap-5">
              {navLinks.map((link, i) => {
                const isActive = activeSection === link.id;
                return (
                  <motion.a
                    key={link.id}
                    href={link.href}
                    onClick={(e) => scrollToSection(e, link.href)}
                    className={`text-base font-bold tracking-[0.2em] uppercase transition-all duration-300 px-6 py-2.5 rounded-xl ${
                      isActive
                        ? "text-blue-400 bg-blue-500/10 border border-blue-500/20"
                        : "text-neutral-500 hover:text-white"
                    }`}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                  >
                    {link.label}
                  </motion.a>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default LandingNav;
