import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Globe, Brain } from "lucide-react";

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
              <stop offset="0%" stopColor="#eab308" />
              <stop offset="25%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#80eeb4" />
              <stop offset="75%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
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
        background: "radial-gradient(125% 125% at 50% 10%, #0F0F1166 50%, #3ca2fa33 100%)",
      }}
    />
  );
}

export default function HoverFooter() {
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
    <footer className="relative bg-[#0F0F11]/10 rounded-3xl overflow-hidden mx-4 md:mx-8 mb-4 md:mb-8">
      <div className="max-w-7xl mx-auto p-8 md:p-14 z-40 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 pb-8 md:pb-12">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="size-6 text-blue-400" />
              <span className="text-white text-xl md:text-2xl font-bold">Aura<span className="text-blue-400">Track</span></span>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Early detection platform for autism spectrum disorder, empowering families and clinicians with AI-driven screening tools.
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-white text-sm font-semibold mb-4 md:mb-6 uppercase tracking-wider">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-neutral-400 hover:text-blue-400 transition-colors duration-300">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-white text-sm font-semibold mb-4 md:mb-6 uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3">
              {contactInfo.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  {item.icon}
                  {item.href ? (
                    <a href={item.href} className="text-sm text-neutral-400 hover:text-blue-400 transition-colors duration-300">
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-sm text-neutral-400">{item.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="border-t border-white/5 my-6 md:my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
          <div className="flex gap-5 text-neutral-500">
            {socialLinks.map(({ icon, label, href }) => (
              <a key={label} href={href} aria-label={label} className="hover:text-blue-400 transition-colors duration-300">
                {icon}
              </a>
            ))}
          </div>
          <p className="text-xs text-neutral-500">
            &copy; {new Date().getFullYear()} AuraTrack. All rights reserved.
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
