import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Brain, TrendingUp, FileText, Moon,
  ChevronRight, Camera, LayoutGrid, UserPlus, Baby, Calendar,
  X, Plus
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { usePatients } from "../hooks/usePatients";
import { api } from "../lib/api";
import WelcomeHeader from "../components/Dashboard/WelcomeHeader";
import StatCard from "../components/Dashboard/StatCard";
import RecentActivity from "../components/Dashboard/RecentActivity";
import GradientButton from "../components/ui/GradientButton";
import AddChildForm from "../components/forms/AddChildForm";

const QUICK_CARDS = [
  { icon: Brain, title: "SDQ Assessment", desc: "25-item standardized behavioral screening", badge: "Clinical", color: "59,147,245", to: "/sdq" },
  { icon: Camera, title: "Vision Analysis", desc: "Upload video/images for YOLOv8 AI detection", badge: "AI", color: "168,85,247", to: "/vision" },
  { icon: TrendingUp, title: "Health Tracker", desc: "Milestones, growth charts, and sleep logging", badge: "Track", color: "20,184,166", to: "/health" },
  { icon: FileText, title: "Document Library", desc: "Encrypted clinical document vault with PDF export", badge: "Storage", color: "245,176,65", to: "/documents" },
];

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 animate-float-slow"
        style={{ background: "radial-gradient(circle, rgba(59,147,245,0.3), transparent 70%)" }} />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-15 animate-float-medium"
        style={{ background: "radial-gradient(circle, rgba(20,184,166,0.3), transparent 70%)" }} />
      <div className="absolute top-1/2 right-16 w-64 h-64 rounded-full opacity-10 animate-float-fast"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.25), transparent 70%)" }} />
    </div>
  );
}

function AddChildModal({ open, onClose }) {
  const { addChild } = usePatients();
  const handleAdd = async (form) => {
    await addChild(form);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b" style={{ borderColor: "var(--card-border)" }}>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Add a Child</h3>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Enter your child's details to begin tracking</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                >
                  <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                </button>
              </div>
              <div className="p-6">
                <AddChildForm onAdd={handleAdd} onCancel={onClose} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function EmptyState({ onOpenModal }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-teal-500/20 flex items-center justify-center mb-6 border border-blue-500/10">
        <Baby className="w-10 h-10 text-blue-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Welcome to AuraTrack!</h2>
      <p className="text-sm max-w-md mb-8" style={{ color: "var(--text-secondary)" }}>
        Get started by adding your first child's profile. You'll be able to track milestones, growth, sleep patterns, and run SDQ assessments.
      </p>
      <button
        onClick={onOpenModal}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
        style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
      >
        <UserPlus className="w-4 h-4" />
        Add Your First Child
      </button>
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const { activePatient, getAgeLabel } = usePatients();
  const navigate = useNavigate();
  const ageLabel = activePatient ? getAgeLabel(activePatient.dob) : "";
  const [showAddChild, setShowAddChild] = useState(false);
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const quickRef = useRef(null);

  const [stats, setStats] = useState({
    sdq: 0,
    milestones: 0,
    growth: 0,
    documents: 0,
    sleep: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!activePatient?.id) {
      setStats({ sdq: 0, milestones: 0, growth: 0, documents: 0, sleep: 0 });
      return;
    }
    setStatsLoading(true);
    Promise.all([
      api(`/sdq/${activePatient.id}`).catch(() => []),
      api(`/health/milestones/${activePatient.id}`).catch(() => []),
      api(`/health/growth/${activePatient.id}`).catch(() => []),
      api(`/documents/${activePatient.id}`).catch(() => []),
      api(`/health/sleep/${activePatient.id}`).catch(() => []),
    ])
      .then(([sdqData, milestonesData, growthData, documentsData, sleepData]) => {
        setStats({
          sdq: (sdqData || []).length,
          milestones: (milestonesData || []).length,
          growth: (growthData || []).length,
          documents: (documentsData || []).length,
          sleep: (sleepData || []).length,
        });
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard stats:", err);
      })
      .finally(() => setStatsLoading(false));
  }, [activePatient?.id]);

  const dynamicStats = [
    { label: "SDQ Assessments", value: stats.sdq, icon: Brain, color: "text-blue-400" },
    { label: "Milestones Logged", value: stats.milestones, icon: Activity, color: "text-teal-400" },
    { label: "Growth Records", value: stats.growth, icon: TrendingUp, color: "text-cyan-400" },
    { label: "Documents", value: stats.documents, icon: FileText, color: "text-amber-400" },
    { label: "Sleep Logs", value: stats.sleep, icon: Moon, color: "text-indigo-400" },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        opacity: 0, y: 30, duration: 0.8, ease: "power3.out",
      });

      if (!statsLoading) {
        gsap.from(statsRef.current?.children || [], {
          opacity: 0, y: 40, scale: 0.9, duration: 0.6,
          stagger: 0.08, ease: "back.out(1.2)",
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [statsLoading]);

  if (!activePatient) {
    return (
      <div ref={containerRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FloatingOrbs />
        <AddChildModal open={showAddChild} onClose={() => setShowAddChild(false)} />
        <div ref={headerRef}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-cyan-400" />
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                  Dashboard
                </h1>
              </div>
              <p className="text-sm ml-4" style={{ color: "var(--text-secondary)" }}>
                Welcome back, {user?.name || "User"}
              </p>
            </div>
          </div>
        </div>
        <EmptyState onOpenModal={() => setShowAddChild(true)} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <FloatingOrbs />
      <AddChildModal open={showAddChild} onClose={() => setShowAddChild(false)} />

      {/* Page Header */}
      <div ref={headerRef}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-cyan-400" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Dashboard
              </h1>
            </div>
            <p className="text-sm ml-4" style={{ color: "var(--text-secondary)" }}>
              Welcome back, {user?.name || "User"}
            </p>
          </div>
          <button
            onClick={() => setShowAddChild(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
          >
            <Plus className="w-4 h-4" />
            Add Child
          </button>
        </div>
      </div>

      <WelcomeHeader patient={activePatient} age={ageLabel} onNavigate={() => navigate("/sdq")} />

      {/* Overview Section */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <LayoutGrid className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: "var(--text-secondary)" }}>
            Overview
          </h2>
          <div className="flex-1 h-px" style={{ background: "var(--card-border)" }} />
        </div>
        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8 pb-8">
          {dynamicStats.map((stat, idx) => (
            <div
              key={stat.label}
              className={idx === dynamicStats.length - 1 ? "col-span-2 md:col-span-1" : ""}
            >
              <StatCard {...stat} loading={statsLoading} />
            </div>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div className="grid grid-cols-1 gap-4 md:gap-5">
        <RecentActivity stats={stats} />
      </div>

      {/* Quick Access */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <LayoutGrid className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: "var(--text-secondary)" }}>
            Quick Access
          </h2>
          <div className="flex-1 h-px" style={{ background: "var(--card-border)" }} />
        </div>
        <div ref={quickRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_CARDS.map((card) => (
            <button
              key={card.to}
              onClick={() => navigate(card.to)}
              className="relative overflow-hidden rounded-2xl p-6 text-left w-full group cursor-pointer border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              style={{
                background: "var(--card-bg)",
                borderColor: "var(--card-border)",
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, rgba(${card.color},0.1), rgba(${card.color},0.02))`,
                }}
              />
              <div
                className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-0 group-hover:opacity-10 transition-all duration-500"
                style={{
                  background: `radial-gradient(circle, rgba(${card.color},0.4), transparent 70%)`,
                }}
              />
              <div className="relative z-[1]">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                    style={{ background: `rgba(${card.color}, 0.12)` }}
                  >
                    <card.icon className="w-6 h-6" style={{ color: `rgb(${card.color})` }} />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full"
                    style={{ background: `rgba(${card.color}, 0.15)`, color: `rgb(${card.color})` }}>
                    {card.badge}
                  </span>
                </div>
                <h3 className="font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>{card.title}</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>{card.desc}</p>
                <span className="text-xs font-medium flex items-center gap-1 transition-all duration-300 group-hover:gap-2"
                  style={{ color: `rgb(${card.color})` }}>
                  Open <ChevronRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
