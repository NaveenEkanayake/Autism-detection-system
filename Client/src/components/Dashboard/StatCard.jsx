import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

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
      className="relative overflow-hidden rounded-xl p-4 border transition-colors duration-300"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--card-border)",
      }}
      whileHover={{
        y: -4,
        borderColor: "rgba(59,147,245,0.3)",
        boxShadow: "0 8px 30px rgba(59,147,245,0.1)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <motion.div
        className="absolute -top-6 -right-6 w-16 h-16 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500"
        style={{ background: "radial-gradient(circle, rgba(59,147,245,0.5), transparent 70%)" }}
      />
      <motion.div
        whileHover={{ rotate: [0, -8, 8, -4, 0] }}
        transition={{ duration: 0.5 }}
        className="mb-2"
      >
        <Icon className={`w-5 h-5 ${color}`} />
      </motion.div>
      <div className="text-2xl font-display font-bold" style={{ color: "var(--text-primary)" }}>
        {loading ? "\u2014" : <Counter to={value} />}
      </div>
      <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{label}</div>
    </motion.div>
  );
}
