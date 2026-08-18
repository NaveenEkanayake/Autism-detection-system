import { motion } from "framer-motion";
import { Activity, Brain, CheckCircle, TrendingUp, Camera, Moon, FileText } from "lucide-react";

const itemsVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariant = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function RecentActivity({ stats }) {
  const hasActivity =
    (stats.sdq || 0) > 0 ||
    (stats.milestones || 0) > 0 ||
    (stats.growth || 0) > 0 ||
    (stats.vision || 0) > 0 ||
    (stats.sleep || 0) > 0 ||
    (stats.documents || 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-2xl p-5 border"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,147,245,0.12)" }}>
          <Activity className="w-4 h-4" style={{ color: "rgb(96,165,250)" }} />
        </div>
        <div>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Recent Activity</span>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Latest interactions with your child&apos;s profile</p>
        </div>
      </div>
      {!hasActivity ? (
        <div className="text-center py-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(59,147,245,0.1)" }}>
            <Activity className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No activity yet. Start with a screening assessment.</p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={itemsVariant} className="space-y-1">
          {stats.sdq > 0 && (
            <motion.div variants={itemVariant} className="flex items-center gap-3.5 p-3 rounded-xl transition-colors hover:bg-white/5" style={{ borderColor: "var(--sidebar-border)" }}>
              <motion.div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(59,147,245,0.15)" }}
                whileHover={{ scale: 1.15, rotate: 5 }}
              >
                <Brain className="w-4 h-4" style={{ color: "rgb(96,165,250)" }} />
              </motion.div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{stats.sdq} SDQ assessment(s) completed</span>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Behavioral screening</p>
              </div>
            </motion.div>
          )}
          {stats.vision > 0 && (
            <motion.div variants={itemVariant} className="flex items-center gap-3.5 p-3 rounded-xl transition-colors hover:bg-white/5" style={{ borderColor: "var(--sidebar-border)" }}>
              <motion.div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(168,85,247,0.15)" }}
                whileHover={{ scale: 1.15, rotate: 5 }}
              >
                <Camera className="w-4 h-4" style={{ color: "rgb(192,132,252)" }} />
              </motion.div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{stats.vision} vision analysis/analyses completed</span>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>AI behavioral screening</p>
              </div>
            </motion.div>
          )}
          {stats.milestones > 0 && (
            <motion.div variants={itemVariant} className="flex items-center gap-3.5 p-3 rounded-xl transition-colors hover:bg-white/5" style={{ borderColor: "var(--sidebar-border)" }}>
              <motion.div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(20,184,166,0.15)" }}
                whileHover={{ scale: 1.15, rotate: 5 }}
              >
                <CheckCircle className="w-4 h-4" style={{ color: "rgb(45,212,191)" }} />
              </motion.div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{stats.milestones} milestone(s) logged</span>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Developmental tracking</p>
              </div>
            </motion.div>
          )}
          {stats.growth > 0 && (
            <motion.div variants={itemVariant} className="flex items-center gap-3.5 p-3 rounded-xl transition-colors hover:bg-white/5">
              <motion.div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(6,182,212,0.15)" }}
                whileHover={{ scale: 1.15, rotate: 5 }}
              >
                <TrendingUp className="w-4 h-4" style={{ color: "rgb(34,211,238)" }} />
              </motion.div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{stats.growth} growth measurement(s) recorded</span>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Height &amp; weight tracking</p>
              </div>
            </motion.div>
          )}
          {stats.sleep > 0 && (
            <motion.div variants={itemVariant} className="flex items-center gap-3.5 p-3 rounded-xl transition-colors hover:bg-white/5">
              <motion.div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(244,63,94,0.15)" }}
                whileHover={{ scale: 1.15, rotate: 5 }}
              >
                <Moon className="w-4 h-4" style={{ color: "rgb(251,113,133)" }} />
              </motion.div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{stats.sleep} sleep session(s) logged</span>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Rest &amp; nap tracking</p>
              </div>
            </motion.div>
          )}
          {stats.documents > 0 && (
            <motion.div variants={itemVariant} className="flex items-center gap-3.5 p-3 rounded-xl transition-colors hover:bg-white/5">
              <motion.div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(234,179,8,0.15)" }}
                whileHover={{ scale: 1.15, rotate: 5 }}
              >
                <FileText className="w-4 h-4" style={{ color: "rgb(250,204,21)" }} />
              </motion.div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{stats.documents} document(s) uploaded</span>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Medical reports vault</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
