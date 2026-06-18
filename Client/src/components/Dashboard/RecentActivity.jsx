import { motion } from "framer-motion";
import { Activity, Brain, CheckCircle, TrendingUp } from "lucide-react";

const itemsVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariant = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function RecentActivity({ stats }) {
  const hasActivity = stats.sdq > 0 || stats.milestones > 0 || stats.growth > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-xl p-4 col-span-2 border"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4" style={{ color: "var(--accent-blue)" }} />
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Recent Activity</span>
      </div>
      {!hasActivity ? (
        <div className="text-center py-6">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No activity yet. Start with a screening assessment.</p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={itemsVariant} className="space-y-2">
          {stats.sdq > 0 && (
            <motion.div variants={itemVariant} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
              <motion.div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(59,147,245,0.15)" }}
                whileHover={{ scale: 1.15, rotate: 5 }}
              >
                <Brain className="w-3.5 h-3.5" style={{ color: "rgb(96,165,250)" }} />
              </motion.div>
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>{stats.sdq} SDQ assessment(s) completed</span>
            </motion.div>
          )}
          {stats.milestones > 0 && (
            <motion.div variants={itemVariant} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
              <motion.div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(20,184,166,0.15)" }}
                whileHover={{ scale: 1.15, rotate: 5 }}
              >
                <CheckCircle className="w-3.5 h-3.5" style={{ color: "rgb(45,212,191)" }} />
              </motion.div>
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>{stats.milestones} milestone(s) logged</span>
            </motion.div>
          )}
          {stats.growth > 0 && (
            <motion.div variants={itemVariant} className="flex items-center gap-3 py-2">
              <motion.div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(6,182,212,0.15)" }}
                whileHover={{ scale: 1.15, rotate: 5 }}
              >
                <TrendingUp className="w-3.5 h-3.5" style={{ color: "rgb(34,211,238)" }} />
              </motion.div>
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>{stats.growth} growth measurement(s) recorded</span>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
