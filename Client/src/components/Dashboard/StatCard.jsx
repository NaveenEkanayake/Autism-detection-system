import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

const COLOR_MAP = {
  "text-blue-400": "59,147,245",
  "text-teal-400": "20,184,166",
  "text-cyan-400": "6,182,212",
  "text-amber-400": "245,176,65",
  "text-indigo-400": "99,102,241",
};

function Counter({ to }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(count, to, { duration: 1.2, ease: "easeOut" });
    return controls.stop;
  }, [to, count]);

  return <motion.span>{rounded}</motion.span>;
}

export default function StatCard({ label, value, icon: Icon, color, loading }) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--card-border)",
      }}
      whileHover={{
        y: -5,
        borderColor: "rgba(59,147,245,0.25)",
        boxShadow: "0 12px 40px rgba(59,147,245,0.08)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <motion.div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-15 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, rgba(${COLOR_MAP[color] || "59,147,245"}, 0.3), transparent 70%)` }}
      />
      <div className="flex items-center justify-between mb-3">
        <motion.div
          whileHover={{ rotate: [0, -10, 10, -5, 0] }}
          transition={{ duration: 0.5 }}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(59,147,245,0.1)" }}
        >
          <Icon className={`w-5 h-5 ${color}`} />
        </motion.div>
      </div>
      <div className="text-2xl font-display font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
        {loading ? "\u2014" : <Counter to={value} />}
      </div>
      <div className="text-xs mt-1 font-medium" style={{ color: "var(--text-secondary)" }}>{label}</div>
    </motion.div>
  );
}
