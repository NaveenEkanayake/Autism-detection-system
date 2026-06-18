import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Activity, Brain, TrendingUp, FileText, Moon,
  ChevronRight, Camera
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { usePatients } from "../hooks/usePatients";
import WelcomeHeader from "../components/Dashboard/WelcomeHeader";
import StatCard from "../components/Dashboard/StatCard";
import SystemStatus from "../components/Dashboard/SystemStatus";
import RecentActivity from "../components/Dashboard/RecentActivity";

const STATS = [
  { label: "SDQ Assessments", value: 3, icon: Brain, color: "text-blue-400" },
  { label: "Milestones Logged", value: 8, icon: Activity, color: "text-teal-400" },
  { label: "Growth Records", value: 5, icon: TrendingUp, color: "text-cyan-400" },
  { label: "Documents", value: 2, icon: FileText, color: "text-amber-400" },
  { label: "Sleep Logs", value: 12, icon: Moon, color: "text-indigo-400" },
];

const QUICK_CARDS = [
  { icon: Brain, title: "SDQ Assessment", desc: "25-item standardized behavioral screening", badge: "Clinical", color: "59,147,245", to: "/sdq" },
  { icon: Camera, title: "Vision Analysis", desc: "Upload video/images for YOLOv8 AI detection", badge: "AI", color: "168,85,247", to: "/vision" },
  { icon: TrendingUp, title: "Health Tracker", desc: "Milestones, growth charts, and sleep logging", badge: "Track", color: "20,184,166", to: "/health" },
  { icon: FileText, title: "Document Library", desc: "Encrypted clinical document vault with PDF export", badge: "Storage", color: "245,176,65", to: "/documents" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, rgba(59,147,245,0.3), transparent 70%)" }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, rgba(20,184,166,0.3), transparent 70%)" }}
        animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 right-16 w-64 h-64 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.25), transparent 70%)" }}
        animate={{ x: [0, 20, 0], y: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const { activePatient, getAgeLabel } = usePatients();
  const navigate = useNavigate();
  const ageLabel = getAgeLabel(activePatient.dob);
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.8]);

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <FloatingOrbs />

      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6">
        <motion.div variants={itemVariants} style={{ opacity: headerOpacity }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <motion.h1
                className="text-2xl font-bold"
                style={{ color: "var(--text-primary)" }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                Dashboard
              </motion.h1>
              <motion.p
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Welcome back, {user.name}
              </motion.p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <WelcomeHeader patient={activePatient} age={ageLabel} onNavigate={() => navigate("/sdq")} />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {STATS.map((stat) => (
            <motion.div key={stat.label} variants={scaleIn} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
              <StatCard {...stat} loading={false} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RecentActivity stats={{ sdq: 3, milestones: 8, growth: 5 }} />
          <SystemStatus />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_CARDS.map((card, idx) => (
            <motion.button
              key={card.to}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(card.to)}
              className="relative overflow-hidden rounded-2xl p-6 text-left w-full group cursor-pointer border transition-all duration-300"
              style={{
                background: "var(--card-bg)",
                borderColor: "var(--card-border)",
              }}
            >
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, rgba(${card.color},0.08), rgba(${card.color},0.02))`,
                }}
              />
              <div className="relative z-[1]">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                    style={{ background: `rgba(${card.color}, 0.12)` }}
                  >
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -5, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <card.icon className="w-6 h-6" style={{ color: `rgb(${card.color})` }} />
                    </motion.div>
                  </div>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-full"
                    style={{ background: `rgba(${card.color}, 0.15)`, color: `rgb(${card.color})` }}>
                    {card.badge}
                  </span>
                </div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{card.title}</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>{card.desc}</p>
                <span className="text-xs font-medium flex items-center gap-1 transition-all duration-300 group-hover:gap-2"
                  style={{ color: `rgb(${card.color})` }}>
                  Open <ChevronRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default DashboardPage;
