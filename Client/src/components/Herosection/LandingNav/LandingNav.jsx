import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sun, Moon } from "lucide-react";
import { useTheme } from "../../../hooks/useTheme";

function MenuIcon({ open, isDark }) {
  return (
    <div className="relative w-5 h-5 flex items-center justify-center">
      <motion.span
        className={`absolute h-[2px] w-5 rounded-full ${isDark ? "bg-white" : "bg-gray-800"}`}
        animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -5 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
      <motion.span
        className={`absolute h-[2px] w-5 rounded-full ${isDark ? "bg-white" : "bg-gray-800"}`}
        animate={open ? { opacity: 0, x: 10 } : { opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.span
        className={`absolute h-[2px] w-5 rounded-full ${isDark ? "bg-white" : "bg-gray-800"}`}
        animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 5 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
    </div>
  );
}

function LandingNav({ activeSection = 0 }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const navLinks = [
    { id: 0, label: "Home", href: "#hero-section" },
    { id: 1, label: "About Us", href: "#about" },
    { id: 2, label: "Features", href: "#features" },
  ];

  const scrollToSection = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      const offset = 80; // Professional offset for the floating nav
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
    setMobileOpen(false);
  };

  return (
    <>
      {/* Desktop Nav - Cinematic Floating Capsule */}
      <nav className="fixed top-0 left-0 right-0 z-[60] hidden md:block p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          {/* Logo */}
          <motion.a 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "expo.out" }}
            href="#hero-section" 
            onClick={(e) => scrollToSection(e, "#hero-section")} 
            className={`flex items-center gap-2 group cursor-pointer ${isDark ? "text-white" : "text-gray-900"}`}
          >
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
              <Brain className="size-5" strokeWidth={2} />
            </div>
            <span className="text-sm font-bold tracking-tight">
              Aura<span className="text-blue-400">Track</span>
            </span>
          </motion.a>

          {/* Nav links - Glass Capsule */}
          <div className={`flex items-center gap-1 px-3 py-2 rounded-2xl backdrop-blur-2xl border shadow-2xl transition-colors duration-300 ${
            isDark
              ? "bg-white/[0.03] border-white/[0.08] shadow-black/20"
              : "bg-black/[0.03] border-black/[0.08] shadow-black/10"
          }`}>
            {navLinks.map((link, i) => {
              const isActive = activeSection === link.id;
              const isLast = i === navLinks.length - 1;
              return (
                <React.Fragment key={link.id}>
                  <a
                    href={link.href}
                    onClick={(e) => scrollToSection(e, link.href)}
                    className={`relative text-[11px] font-bold tracking-widest uppercase transition-all duration-500 px-4 py-2 rounded-xl ${
                      isActive
                        ? "text-blue-500 bg-blue-500/10 shadow-inner"
                        : isDark
                          ? "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.05]"
                          : "text-neutral-500 hover:text-gray-700 hover:bg-black/[0.05]"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-line"
                        className="absolute bottom-1 left-2 right-2 h-[2px] bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      />
                    )}
                  </a>
                  {!isLast && <span className={`w-px h-3 mx-1 ${isDark ? "bg-white/5" : "bg-black/5"}`} />}
                </React.Fragment>
              );
            })}
          </div>

          {/* Theme Toggle - Cinematic Button */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "expo.out" }}
            onClick={toggleTheme}
            className={`relative w-10 h-10 rounded-xl backdrop-blur-xl border flex items-center justify-center transition-all duration-300 shadow-lg ${
              isDark
                ? "bg-white/[0.03] border-white/[0.08] text-neutral-400 hover:text-white hover:bg-white/10 hover:border-white/20 shadow-black/20"
                : "bg-black/[0.03] border-black/[0.08] text-neutral-500 hover:text-gray-800 hover:bg-black/10 hover:border-black/20 shadow-black/10"
            }`}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.button>
        </div>
      </nav>

      {/* Mobile Nav */}
      <nav className="fixed top-0 left-0 right-0 z-[60] md:hidden p-4">
        <div className="flex items-center justify-between h-14 px-2">
          <a href="#hero-section" onClick={(e) => scrollToSection(e, "#hero-section")} className={`flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            <div className="p-1 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
              <Brain className="size-4" strokeWidth={2} />
            </div>
            <span className="text-xs font-bold tracking-tight">
              Aura<span className="text-blue-400">Track</span>
            </span>
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`relative w-9 h-9 rounded-xl backdrop-blur-xl border flex items-center justify-center transition-all ${
                isDark
                  ? "bg-white/[0.03] border-white/[0.08] text-neutral-400 hover:text-white"
                  : "bg-black/[0.03] border-black/[0.08] text-neutral-500 hover:text-gray-800"
              }`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              className={`relative w-9 h-9 rounded-xl backdrop-blur-xl border flex items-center justify-center z-[70] ${
                isDark
                  ? "bg-white/[0.03] border-white/[0.08]"
                  : "bg-black/[0.03] border-black/[0.08]"
              }`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              <MenuIcon open={mobileOpen} isDark={isDark} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay - Cinematic Fade */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className={`fixed inset-0 z-40 md:hidden flex flex-col items-center justify-center backdrop-blur-3xl ${
              isDark ? "bg-neutral-950/95" : "bg-white/95"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <nav className="flex flex-col items-center gap-6">
              {navLinks.map((link, i) => {
                const isActive = activeSection === link.id;
                return (
                  <motion.a
                    key={link.id}
                    href={link.href}
                    onClick={(e) => scrollToSection(e, link.href)}
                    className={`text-lg font-bold tracking-[0.2em] uppercase transition-all duration-300 px-8 py-3 rounded-2xl ${
                      isActive
                        ? "text-blue-500 bg-blue-500/10 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                        : isDark
                          ? "text-neutral-500 hover:text-white"
                          : "text-neutral-500 hover:text-gray-900"
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: i * 0.1, duration: 0.4, ease: "expo.out" }}
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
