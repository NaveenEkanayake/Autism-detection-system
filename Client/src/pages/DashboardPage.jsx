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
import { usePatients } from "../hooks/PatientsContext";
import { api } from "../lib/api";
import WelcomeHeader from "../components/Dashboard/WelcomeHeader";
import StatCard from "../components/Dashboard/StatCard";
import SystemStatus from "../components/Dashboard/SystemStatus";
import RecentActivity from "../components/Dashboard/RecentActivity";
import GradientButton from "../components/ui/GradientButton";

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

// Supports letters from any language (unicode), spaces, hyphens, apostrophes
const NAME_REGEX = /^[\p{L}\s'-]+$/u;

function validateChildName(name) {
  if (!name.trim()) return "Child's name is required.";
  if (name.trim().length < 2) return "Name must be at least 2 characters.";
  if (name.trim().length > 50) return "Name is too long.";
  if (!NAME_REGEX.test(name.trim())) return "Name contains invalid characters.";
  return "";
}

function validateDob(dob) {
  if (!dob) return "Date of birth is required.";
  const birthDate = new Date(dob);
  const today = new Date();
  if (birthDate > today) return "Date of birth cannot be in the future.";
  const ageMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
  if (ageMonths < 1) return "Child must be at least 1 month old.";
  if (ageMonths > 12 * 18) return "Age seems too old for this tracker (max 18 years).";
  return "";
}

function AddChildForm({ onAdd, onCancel }) {
  const [form, setForm] = useState({ name: "", dob: "", sex: "male" });
  const [errors, setErrors] = useState({ name: "", dob: "" });
  const [touched, setTouched] = useState({ name: false, dob: false });
  const [saving, setSaving] = useState(false);

  const maxDate = new Date().toISOString().split("T")[0];
  const minDate = new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const err = field === "name" ? validateChildName(value) : field === "dob" ? validateDob(value) : "";
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = field === "name" ? validateChildName(form[field]) : validateDob(form[field]);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const isValid = form.name.trim().length >= 2 && form.dob && !validateChildName(form.name) && !validateDob(form.dob);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nameErr = validateChildName(form.name);
    const dobErr = validateDob(form.dob);
    setErrors({ name: nameErr, dob: dobErr });
    setTouched({ name: true, dob: true });

    if (nameErr || dobErr) return;

    setSaving(true);
    try {
      await onAdd(form);
      setForm({ name: "", dob: "", sex: "male" });
      setTouched({ name: false, dob: false });
      setErrors({ name: "", dob: "" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-1.5">Child's Name</label>
        <div className="relative">
          <Baby className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            placeholder="Alex"
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 transition-all ${
              errors.name && touched.name ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:border-teal-500/50 focus:ring-teal-500/30"
            }`}
            required
          />
        </div>
        {errors.name && touched.name && (
          <p className="mt-1 text-xs text-red-400">{errors.name}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-1.5">Date of Birth</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
          <input
            type="date"
            value={form.dob}
            min={minDate}
            max={maxDate}
            onChange={(e) => handleChange("dob", e.target.value)}
            onBlur={() => handleBlur("dob")}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border text-white focus:outline-none focus:ring-1 transition-all [color-scheme:dark] ${
              errors.dob && touched.dob ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:border-teal-500/50 focus:ring-teal-500/30"
            }`}
            required
          />
        </div>
        {errors.dob && touched.dob && (
          <p className="mt-1 text-xs text-red-400">{errors.dob}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">Biological Sex</label>
        <div className="grid grid-cols-3 gap-3">
          {["male", "female", "other"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setForm({ ...form, sex: s })}
              className={"py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border capitalize " + (form.sex === s ? "border-teal-500 text-teal-300" : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-white")}
              style={form.sex === s ? { background: "rgba(20,184,166,0.12)" } : { background: "rgba(255,255,255,0.04)" }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-[50px] text-sm font-semibold border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
        >
          Cancel
        </button>
        <GradientButton type="submit" loading={saving} disabled={!isValid} className="flex-1">
          <span className="label">{saving ? "Adding..." : "Add Child"}</span>
        </GradientButton>
      </div>
    </form>
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

      {/* Activity & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        <RecentActivity stats={stats} />
        <SystemStatus />
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
