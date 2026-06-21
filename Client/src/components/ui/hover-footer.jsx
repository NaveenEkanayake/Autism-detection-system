import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Globe, Brain } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

function TextHoverEffect({ text, className }) {
  const svgRef = useRef(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

  useEffect(() => {
    if (svgRef.current && cursor.x !== null && cursor.y !== null) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
      const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
      setMaskPosition({ cx: `${cxPercentage}%`, cy: `${cyPercentage}%` });
    }
  }, [cursor]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 300 100"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      className="select-none cursor-pointer"
    >
      <defs>
        <linearGradient id="textGradient" gradientUnits="userSpaceOnUse" cx="50%" cy="50%" r="25%">
          {hovered && (
            <>
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="25%" stopColor="#2dd4bf" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="75%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </>
          )}
        </linearGradient>
        <motion.radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="20%"
          initial={{ cx: "50%", cy: "50%" }}
          animate={maskPosition}
          transition={{ duration: 0, ease: "easeOut" }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id="textMask">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#revealMask)" />
        </mask>
      </defs>
      <text
        x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        strokeWidth="0.3"
        className="fill-transparent stroke-neutral-800 font-bold text-7xl"
        style={{ opacity: hovered ? 0.7 : 0 }}
      >
        {text}
      </text>
      <motion.text
        x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        strokeWidth="0.3"
        className="fill-transparent stroke-blue-400 font-bold text-7xl"
        initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
        animate={{ strokeDashoffset: 0, strokeDasharray: 1000 }}
        transition={{ duration: 4, ease: "easeInOut" }}
      >
        {text}
      </motion.text>
      <text
        x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        stroke="url(#textGradient)" strokeWidth="0.3" mask="url(#textMask)"
        className="fill-transparent font-bold text-7xl"
      >
        {text}
      </text>
    </svg>
  );
}

function FooterBackgroundGradient() {
  return (
    <div
      className="absolute inset-0 z-0"
      style={{
        background: "radial-gradient(125% 125% at 50% 10%, #0F0F1166 50%, #3ca2fa11 100%)",
      }}
    />
  );
}

function HoverFooter() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const footerLinks = [
    {
      title: "About Us",
      links: [
        { label: "Our Mission", href: "#" },
        { label: "The Team", href: "#" },
        { label: "Careers", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Research", href: "#" },
        { label: "Documentation", href: "#" },
      ],
    },
    {
      title: "Our Project",
      links: [
        { label: "AI Detection Engine", href: "#" },
        { label: "SDQ Assessment Tool", href: "#" },
        { label: "Health Tracker", href: "#" },
        { label: "Clinical Dashboard", href: "#" },
      ],
    },
  ];

  const contactInfo = [
    { icon: <Mail size={18} className="text-blue-400" />, text: "hello@auratrack.com", href: "mailto:hello@auratrack.com" },
    { icon: <Phone size={18} className="text-blue-400" />, text: "+1 (555) 123-4567", href: "tel:+15551234567" },
    { icon: <MapPin size={18} className="text-blue-400" />, text: "San Francisco, CA" },
  ];

  const socialLinks = [
    { icon: <Globe size={18} />, label: "Facebook", href: "#" },
    { icon: <Globe size={18} />, label: "Twitter", href: "#" },
    { icon: <Globe size={18} />, label: "LinkedIn", href: "#" },
    { icon: <Globe size={18} />, label: "GitHub", href: "#" },
  ];

  return (
    <footer id="footer-section" className="relative rounded-[48px] overflow-hidden mx-4 md:mx-8 mb-4 md:mb-8 shadow-2xl" style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}`, backgroundColor: isDark ? "rgba(15,15,17,0.4)" : "rgba(15,15,17,0.03)" }}>
      <div className="max-w-7xl mx-auto p-8 md:p-16 z-40 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
                <Brain className="size-6" style={{ color: "var(--landing-text)" }} />
              </div>
              <span className="text-2xl font-bold tracking-tight" style={{ color: "var(--landing-text)" }}>Aura<span className="text-blue-400">Track</span></span>
            </div>
            <p className="text-sm leading-relaxed opacity-80" style={{ color: "var(--landing-text-secondary)" }}>
              Empowering the next generation through AI-driven early autism detection and comprehensive pediatric tracking.
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-bold mb-6 uppercase tracking-widest" style={{ color: "var(--landing-text)" }}>{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm transition-all duration-300 hover:text-blue-400 hover:translate-x-1 inline-block" style={{ color: "var(--landing-text-secondary)" }}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-xs font-bold mb-6 uppercase tracking-widest" style={{ color: "var(--landing-text)" }}>Contact</h4>
            <ul className="space-y-4">
              {contactInfo.map((item, i) => (
                <li key={i} className="flex items-center gap-3 group cursor-pointer">
                  <div className="p-2 rounded-lg transition-colors" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}>
                    {item.icon}
                  </div>
                  {item.href ? (
                    <a href={item.href} className="text-sm transition-colors duration-300 group-hover:text-blue-400" style={{ color: "var(--landing-text-secondary)" }}>
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-sm transition-colors duration-300 group-hover:text-blue-400" style={{ color: "var(--landing-text-secondary)" }}>{item.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="my-10" style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` }} />

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-6">
            {socialLinks.map(({ icon, label, href }) => (
              <a key={label} href={href} aria-label={label} className="p-2 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-300" style={{ color: "var(--text-muted)", backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}>
                {icon}
              </a>
            ))}
          </div>
          <p className="text-xs tracking-wide opacity-60" style={{ color: "var(--text-muted)" }}>
            &copy; {new Date().getFullYear()} AuraTrack. Engineered for Precision.
          </p>
        </div>
      </div>

      <div className="hidden lg:flex h-[30rem] -mt-52 -mb-36">
        <TextHoverEffect text="Aura" />
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}

export default HoverFooter;
