import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Brain, Camera, TrendingUp, FileText, Calendar,
  ChevronRight, Activity, Moon, CheckCircle, LogOut, Sparkles, ChevronDown, UserPlus, Plus, Trash2, Edit2
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { usePatients } from "../../hooks/usePatients";
import { useTheme } from "../../hooks/useTheme";
import { api } from "../../lib/api";
import SkyToggle from "../ui/SkyToggle";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { to: "/sdq", icon: Brain, label: "SDQ Assessment" },
  { to: "/health", icon: TrendingUp, label: "Health Tracker" },
  { to: "/documents", icon: FileText, label: "Documents" },
  { to: "/events", icon: Calendar, label: "Reminders & Events" },
];

const ANALYSIS_DROPDOWN = [
  { to: "/vision", icon: Camera, label: "Vision Analysis" },
  { to: "/ai-chat", icon: Sparkles, label: "AI Suggestion" },
];

const SIDEBAR_WIDTH = 280;

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { patients, activePatient, getAgeLabel, switchPatient, deleteChild, setAddChildOpen, setEditingChild } = usePatients();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const ageLabel = activePatient ? getAgeLabel(activePatient.dob) : "";
  const [analysisOpen, setAnalysisOpen] = useState(true);
  const [childDropdownOpen, setChildDropdownOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [stats, setStats] = useState({
    sdq: 0,
    milestones: 0,
    growth: 0,
    sleep: 0,
  });

  useEffect(() => {
    if (!activePatient?.id) {
      setStats({ sdq: 0, milestones: 0, growth: 0, sleep: 0 });
      return;
    }
    const fetchSidebarStats = async () => {
      try {
        const sdqHistory = await api(`/sdq/history/${activePatient.id}`).catch(() => ({ submissions: [] }));
        const sdqSubmissions = sdqHistory.submissions || [];

        const milestonesData = JSON.parse(localStorage.getItem(`milestones_${activePatient.id}`) || "[]");
        const growthData = JSON.parse(localStorage.getItem(`growth_${activePatient.id}`) || "[]");
        const sleepData = JSON.parse(localStorage.getItem(`sleep_${activePatient.id}`) || "[]");

        setStats({
          sdq: sdqSubmissions.length,
          milestones: milestonesData.length,
          growth: growthData.length,
          sleep: sleepData.length,
        });
      } catch (err) {
        console.error("Failed to fetch sidebar stats from backend:", err);
      }
    };
    fetchSidebarStats();
  }, [activePatient?.id, patients, location.pathname]);

  const dynamicQuickStats = [
    { label: "SDQ", value: stats.sdq, color: "text-blue-400", icon: Brain },
    { label: "Miles.", value: stats.milestones, color: "text-teal-400", icon: CheckCircle },
    { label: "Growth", value: stats.growth, color: "text-cyan-400", icon: Activity },
    { label: "Sleep", value: stats.sleep, color: "text-indigo-400", icon: Moon },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
    onClose();
  };

  return (
    <motion.aside
      initial={false}
      animate={{ x: open ? 0 : -SIDEBAR_WIDTH }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-0 left-0 z-50 h-full flex flex-col border-r shadow-2xl shadow-black/10"
      style={{
        width: SIDEBAR_WIDTH,
        background: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
          <Brain className="size-5 text-white" strokeWidth={2} />
        </div>
        <span className="text-sm font-bold tracking-tight">
          Aura<span className="text-blue-400">Track</span>
        </span>
      </div>

      {/* User info — clickable to profile */}
      <button
        onClick={() => { navigate("/profile"); onClose(); }}
        className="px-6 py-4 border-b w-full text-left transition-all hover:bg-white/5 cursor-pointer bg-transparent border-0 border-b" style={{ borderColor: "var(--sidebar-border)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{user?.name || "User"}</p>
            <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{user?.email || ""}</p>
          </div>
          <Edit2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
        </div>
      </button>

      {/* Children Switcher */}
      <div className="mx-4 mt-4">
        <div className="relative">
          {activePatient ? (
            <button
              onClick={() => setChildDropdownOpen(!childDropdownOpen)}
              className="w-full p-3.5 rounded-xl border flex items-center gap-3 transition-all hover:bg-white/5"
              style={{ borderColor: "var(--sidebar-border)", background: "linear-gradient(135deg, rgba(59,147,245,0.08), rgba(20,184,166,0.06))" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0 shadow-md"
                style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}>
                {activePatient.name[0]}
              </div>
              <div className="overflow-hidden flex-1 text-left">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{activePatient.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(59,147,245,0.15)", color: "#60a5fa" }}>{ageLabel}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize" style={{ background: "rgba(20,184,166,0.15)", color: "#2dd4bf" }}>{activePatient.sex}</span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
            </button>
          ) : (
            <button
              onClick={() => setChildDropdownOpen(!childDropdownOpen)}
              className="w-full p-3.5 rounded-xl border flex items-center gap-3 transition-all hover:bg-white/5"
              style={{ borderColor: "var(--sidebar-border)", background: "var(--hover-bg)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0 shadow-md" style={{ background: "rgba(59,147,245,0.15)", color: "#60a5fa" }}>
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No Child Selected</p>
                <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>Add a child to begin</p>
              </div>
              <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
            </button>
          )}

          <AnimatePresence>
            {childDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1 pl-2">
                  {patients.map((p) => (
                    confirmDeleteId === p.id ? (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-500/30"
                        style={{ background: "rgba(239,68,68,0.08)" }}
                      >
                        <span className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>
                          Delete {p.name}?
                        </span>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setDeletingId(p.id);
                            try {
                              await deleteChild(p.id);
                              setConfirmDeleteId(null);
                              if (patients.length <= 1) {
                                setChildDropdownOpen(false);
                              }
                            } catch {
                              /* toast handles error */
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                          disabled={deletingId === p.id}
                          className="px-2 py-1 rounded-lg text-xs font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                        >
                          {deletingId === p.id ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                          ) : (
                            "Delete"
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-white/10"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div
                        key={p.id}
                        className="flex items-center gap-1 group"
                      >
                        <button
                          onClick={() => {
                            switchPatient(p);
                            setChildDropdownOpen(false);
                            navigate(`/child/${p.id}`);
                          }}
                          className={"flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left border " + (activePatient?.id === p.id ? "border-blue-500/20 text-[var(--text-primary)]" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-500/20")}
                          style={activePatient?.id === p.id ? { background: "linear-gradient(135deg, rgba(59,147,245,0.2), rgba(20,184,166,0.12))" } : {}}
                        >
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}>
                            {p.name[0]}
                          </div>
                          <span className="flex-1 truncate">{p.name}</span>
                          {activePatient?.id === p.id && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChild(p);
                            setAddChildOpen(true);
                            setChildDropdownOpen(false);
                          }}
                          className="p-2 rounded-lg opacity-75 hover:opacity-100 transition-all duration-200 hover:bg-blue-500/10"
                          style={{ color: "rgba(96,165,250,0.8)" }}
                          title={`Edit ${p.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(p.id);
                          }}
                          className="p-2 rounded-lg opacity-75 hover:opacity-100 transition-all duration-200 hover:bg-red-500/10"
                          style={{ color: "rgba(248,113,113,0.8)" }}
                          title={`Remove ${p.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  ))}
                  <button
                    onClick={() => {
                      setChildDropdownOpen(false);
                      setAddChildOpen(true);
                      navigate("/dashboard");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border border-dashed border-white/10 text-neutral-400 hover:text-white hover:border-blue-500/20 hover:bg-blue-500/5"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(59,147,245,0.1)" }}>
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                    <span>Add Child</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border " +
              (isActive
                ? "border-blue-500/20 text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-500/20 hover:bg-gradient-to-r hover:from-blue-500/15 hover:to-emerald-500/10")
            }
            style={({ isActive }) => ({
              background: isActive ? "linear-gradient(135deg, rgba(59,147,245,0.2), rgba(20,184,166,0.12))" : "",
            })}
          >
            {({ isActive }) => (
              <>
                <Icon className={"w-4 h-4 flex-shrink-0 " + (isActive ? "text-blue-400" : "")} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
              </>
            )}
          </NavLink>
        ))}

        {/* Analysis Dropdown */}
        <div>
          <button
            onClick={() => setAnalysisOpen(!analysisOpen)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border border-transparent w-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-500/20 hover:bg-gradient-to-r hover:from-blue-500/15 hover:to-emerald-500/10"
          >
            <Camera className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">Analysis</span>
            <motion.div
              animate={{ rotate: analysisOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.div>
          </button>
          <AnimatePresence>
            {analysisOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="ml-3 mt-1 space-y-1 border-l-2 pl-3" style={{ borderColor: "var(--sidebar-border)" }}>
                  {ANALYSIS_DROPDOWN.map(({ to, icon: Icon, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        "flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border " +
                        (isActive
                          ? "border-blue-500/20 text-[var(--text-primary)]"
                          : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-500/20")
                      }
                      style={({ isActive }) => ({
                        background: isActive ? "linear-gradient(135deg, rgba(59,147,245,0.2), rgba(20,184,166,0.12))" : "",
                      })}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className={"w-3.5 h-3.5 flex-shrink-0 " + (isActive ? "text-blue-400" : "")} />
                          <span className="flex-1">{label}</span>
                          {isActive && <ChevronRight className="w-3 h-3 text-blue-400" />}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Theme Toggle + Logout */}
      <div className="px-4 pt-4 pb-3 border-t space-y-4" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {theme === "dark" ? "Dark Mode" : "Light Mode"}
          </span>
          <SkyToggle
            checked={theme === "dark"}
            onChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full border border-transparent hover:bg-red-500/10 hover:border-red-500/20"
          style={{ color: "rgba(248,113,113,0.7)" }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Logout</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="grid grid-cols-4 gap-2">
          {dynamicQuickStats.map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="text-center p-1.5 rounded-lg transition-colors hover:bg-white/5">
              <Icon className={"w-4 h-4 mx-auto mb-1 " + color} />
              <p className={"text-sm font-bold leading-none " + color}>{value}</p>
              <p className="text-[9px] mt-1 leading-tight" style={{ color: "var(--text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.aside>
  );
}
