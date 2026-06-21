import { motion } from "framer-motion";
import { Clock, Shield, Database, Eye, FileText } from "lucide-react";

const SERVICES = [
  { label: "Firebase Auth", icon: Shield, color: "rgb(96,165,250)", bg: "rgba(96,165,250,0.12)" },
  { label: "Supabase DB", icon: Database, color: "rgb(45,212,191)", bg: "rgba(45,212,191,0.12)" },
  { label: "Vision Pipeline", icon: Eye, color: "rgb(168,85,247)", bg: "rgba(168,85,247,0.12)" },
  { label: "PDF Exporter", icon: FileText, color: "rgb(251,146,60)", bg: "rgba(251,146,60,0.12)" },
];

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
    <span className="relative inline-flex w-2.5 h-2.5">
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ background: "rgb(34,197,94)" }}
        animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="relative inline-flex w-2.5 h-2.5 rounded-full" style={{ background: "rgb(34,197,94)" }} />
    </span>
  );
}

export default function SystemStatus() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      className="rounded-2xl p-5 border"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(34,197,94,0.12)" }}>
          <Clock className="w-4 h-4" style={{ color: "rgb(34,197,94)" }} />
        </div>
        <div>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>System Status</span>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>All services operational</p>
        </div>
      </div>
      <motion.div initial="hidden" animate="visible" variants={containerVariant} className="space-y-1">
        {SERVICES.map((s) => (
          <motion.div key={s.label} variants={itemVariant} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
              <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
            </div>
            <span className="text-sm flex-1" style={{ color: "var(--text-secondary)" }}>{s.label}</span>
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
