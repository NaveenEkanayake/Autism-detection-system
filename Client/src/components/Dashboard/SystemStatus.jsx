import { motion } from "framer-motion";
import { Clock } from "lucide-react";

const SERVICES = ["Firebase Auth", "Supabase DB", "Vision Pipeline", "PDF Exporter"];

const containerVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const itemVariant = {
  hidden: { opacity: 0, x: -15 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

function PulsingDot() {
  return (
    <span className="relative inline-flex w-2 h-2">
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ background: "rgb(34,197,94)" }}
        animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: "rgb(34,197,94)" }} />
    </span>
  );
}

export default function SystemStatus() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      className="rounded-xl p-4 border"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>System Status</span>
      </div>
      <motion.div initial="hidden" animate="visible" variants={containerVariant} className="space-y-2.5">
        {SERVICES.map((s) => (
          <motion.div key={s} variants={itemVariant} className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{s}</span>
            <div className="flex items-center gap-1.5">
              <PulsingDot />
              <span className="text-[10px] font-semibold" style={{ color: "rgb(34,197,94)" }}>Online</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
