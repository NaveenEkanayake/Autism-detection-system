import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Brain, Camera, TrendingUp, FileText,
  ChevronRight, Activity, Moon, CheckCircle, LogOut, Menu, Sparkles, ChevronDown
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { usePatients } from "../../hooks/PatientsContext";
import { useTheme } from "../../hooks/useTheme";
import SkyToggle from "../ui/SkyToggle";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { to: "/sdq", icon: Brain, label: "SDQ Assessment" },
  { to: "/health", icon: TrendingUp, label: "Health Tracker" },
  { to: "/documents", icon: FileText, label: "Documents" },
];

const ANALYSIS_DROPDOWN = [
  { to: "/vision", icon: Camera, label: "Vision Analysis" },
  { to: "/ai-chat", icon: Sparkles, label: "AI Suggestion" },
];

const QUICK_STATS = [
  { label: "SDQ", value: 3, color: "text-blue-400", icon: Brain },
  { label: "Miles.", value: 8, color: "text-teal-400", icon: CheckCircle },
  { label: "Growth", value: 5, color: "text-cyan-400", icon: Activity },
  { label: "Sleep", value: 12, color: "text-indigo-400", icon: Moon },
];

const SIDEBAR_WIDTH = 280;

function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { activePatient, getAgeLabel } = usePatients();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const ageLabel = activePatient ? getAgeLabel(activePatient.dob) : "";
  const [analysisOpen, setAnalysisOpen] = useState(true);

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

      {/* User info */}
      <div className="px-6 py-4 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{user?.name || "User"}</p>
            <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{user?.email || ""}</p>
          </div>
        </div>
      </div>

      {/* Active Patient */}
      {activePatient && (
      <div className="mx-4 mt-4 p-3.5 rounded-xl border" style={{ borderColor: "var(--sidebar-border)", background: "linear-gradient(135deg, rgba(59,147,245,0.08), rgba(20,184,166,0.06))" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0 shadow-md"
            style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}>
            {activePatient.name[0]}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{activePatient.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(59,147,245,0.15)", color: "#60a5fa" }}>{ageLabel}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize" style={{ background: "rgba(20,184,166,0.15)", color: "#2dd4bf" }}>{activePatient.sex}</span>
            </div>
          </div>
        </div>
      </div>
      )}

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
          {QUICK_STATS.map(({ label, value, color, icon: Icon }) => (
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

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isMobile, sidebarOpen]);

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)", color: "var(--text-primary)" }}>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <button
        onClick={() => setSidebarOpen((p) => !p)}
        className="fixed top-4 z-[60] w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg backdrop-blur-sm"
        style={{
          left: !isMobile && sidebarOpen ? "292px" : "16px",
          background: "var(--card-bg)",
          borderColor: "var(--card-border)",
          borderWidth: 1,
        }}
        aria-label="Toggle sidebar"
      >
        <Menu className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
      </button>

      <main
        className="transition-all duration-300 ease-in-out"
        style={{ marginLeft: !isMobile && sidebarOpen ? "280px" : "0px" }}
      >
        <div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
