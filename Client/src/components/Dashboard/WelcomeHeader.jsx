import { motion } from "framer-motion";
import { Plus, Zap } from "lucide-react";

const badgeVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.08, duration: 0.3, ease: "easeOut" },
  }),
};

export default function WelcomeHeader({ patient, age, onAddChild }) {
  if (!patient) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl p-6 md:p-7 border"
      style={{
        background: "linear-gradient(135deg, rgba(59,147,245,0.08), rgba(20,184,166,0.06))",
        borderColor: "var(--card-border)",
      }}
    >
      <motion.div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, rgba(59,147,245,0.4), transparent 70%)" }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-5"
        style={{ background: "radial-gradient(circle, rgba(20,184,166,0.4), transparent 70%)" }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-[1]">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-lg"
            style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
          >
            {patient.name[0]}
          </motion.div>
          <div className="min-w-0">
            <motion.h2
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="font-display text-xl md:text-2xl font-bold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {patient.name}
            </motion.h2>
            <motion.div
              initial="hidden"
              animate="visible"
              className="flex flex-wrap items-center gap-2 mt-2"
            >
              {[
                { label: `${age} old`, className: "text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full", style: { background: "rgba(59,147,245,0.15)", color: "rgb(96,165,250)" } },
                { label: patient.sex, className: "text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full capitalize", style: { background: "rgba(20,184,166,0.15)", color: "rgb(45,212,191)" } },
                { label: "Active", className: "text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full", style: { background: "rgba(168,85,247,0.15)", color: "rgb(192,132,252)" } },
              ].map((badge, i) => (
                <motion.span
                  key={badge.label}
                  custom={i}
                  variants={badgeVariants}
                  className={badge.className}
                  style={badge.style}
                >
                  {badge.label}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all duration-300 shadow-lg shadow-blue-500/15 w-full sm:w-auto cursor-pointer"
          style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
          onClick={onAddChild}
        >
          <Plus className="w-4 h-4" /> Add Child
        </motion.button>
      </div>
    </motion.div>
  );
}

export function EmptyState({ onNavigate }) {
  return (
    <div className="p-8 md:p-10 text-center rounded-2xl border border-dashed" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
      <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(59,147,245,0.15)" }}>
        <Zap className="w-7 h-7 text-blue-400" />
      </div>
      <p className="mb-5 text-base" style={{ color: "var(--text-secondary)" }}>No child profile found. Add one to get started.</p>
      <button
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/15"
        style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
        onClick={() => onNavigate("onboarding")}
      >
        <Plus className="w-4 h-4" /> Add Child Profile
      </button>
    </div>
  );
}
