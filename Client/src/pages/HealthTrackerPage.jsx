import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ArrowLeft, Activity, TrendingUp, Moon, X, Edit2, Trash2 } from "lucide-react";
import { usePatients } from "../hooks/usePatients";
import { showToast } from "../components/ui/toast";
import { api } from "../lib/api";
import TabBar from "../components/Health/TabBar";
import MilestoneSection from "../components/Health/MilestoneSection";
import GrowthChartSection from "../components/Health/GrowthChartSection";
import SleepLogSection from "../components/Health/SleepLogSection";

const TABS = [
  { id: "milestones", label: "Milestones", icon: Activity },
  { id: "growth", label: "Growth", icon: TrendingUp },
  { id: "sleep", label: "Sleep", icon: Moon },
];

const CATEGORY_COLORS = {
  Social: { bg: "rgba(59,147,245,0.15)", text: "#60a5fa" },
  Motor: { bg: "rgba(20,184,166,0.15)", text: "#2dd4bf" },
  Language: { bg: "rgba(34,211,238,0.15)", text: "#22d3ee" },
  Vision: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24" },
  General: { bg: "rgba(100,116,139,0.15)", text: "#94a3b8" },
};

const QUALITY_COLORS = {
  excellent: { bg: "rgba(34,197,94,0.15)", text: "#4ade80" },
  good: { bg: "rgba(20,184,166,0.15)", text: "#2dd4bf" },
  fair: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24" },
  poor: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
};

function HealthTrackerPage() {
  const navigate = useNavigate();
  const { activePatient, getAgeMonths } = usePatients();
  const ageMonths = activePatient ? getAgeMonths(activePatient.dob) : 0;
  const containerRef = useRef(null);

  const [activeTab, setActiveTab] = useState("milestones");
  const [milestones, setMilestones] = useState({});
  const [milestoneLogs, setMilestoneLogs] = useState([]);
  const [growthLogs, setGrowthLogs] = useState([]);
  const [sleepLogs, setSleepLogs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [crudLoading, setCrudLoading] = useState(false);

  // Edit states
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [editingGrowth, setEditingGrowth] = useState(null);
  const [editingSleep, setEditingSleep] = useState(null);

  const [showGrowthForm, setShowGrowthForm] = useState(false);
  const [showSleepForm, setShowSleepForm] = useState(false);
  const [growthForm, setGrowthForm] = useState({ weight_kg: "", height_cm: "", head_cm: "" });
  const [sleepForm, setSleepForm] = useState({ start_time: "", end_time: "", quality: "good", notes: "" });
  const [saving, setSaving] = useState(false);

  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ label: "", category: "Social", age_months: "" });

  // Reset state when switching children
  useEffect(() => {
    setMilestoneLogs([]);
    setGrowthLogs([]);
    setSleepLogs([]);
    setShowMilestoneForm(false);
    setShowGrowthForm(false);
    setShowSleepForm(false);
    setEditingMilestone(null);
    setEditingGrowth(null);
    setEditingSleep(null);
  }, [activePatient?.id]);

  // Fetch all health data from backend APIs
  useEffect(() => {
    if (!activePatient?.id) {
      setDataLoading(false);
      return;
    }
    setDataLoading(true);

    const loadAll = async () => {
      // Milestones
      try {
        const ms = await api(`/health/milestones?child_id=${activePatient.id}`);
        if (Array.isArray(ms)) {
          setMilestoneLogs(ms);
          const obj = {};
          ms.forEach(m => { obj[m.id] = { completed: true, ...m }; });
          setMilestones(obj);
          localStorage.setItem(`milestones_${activePatient.id}`, JSON.stringify(ms));
        }
      } catch {
        const local = JSON.parse(localStorage.getItem(`milestones_${activePatient.id}`) || "[]");
        setMilestoneLogs(local);
        const obj = {};
        local.forEach(m => { obj[m.id || m.key] = { completed: true, ...m }; });
        setMilestones(obj);
      }

      // Growth
      try {
        const g = await api(`/health/growth?child_id=${activePatient.id}`);
        if (Array.isArray(g)) {
          setGrowthLogs(g);
          localStorage.setItem(`growth_${activePatient.id}`, JSON.stringify(g));
        }
      } catch {
        setGrowthLogs(JSON.parse(localStorage.getItem(`growth_${activePatient.id}`) || "[]"));
      }

      // Sleep
      try {
        const s = await api(`/health/sleep?child_id=${activePatient.id}`);
        if (Array.isArray(s)) {
          setSleepLogs(s);
          localStorage.setItem(`sleep_${activePatient.id}`, JSON.stringify(s));
        }
      } catch {
        setSleepLogs(JSON.parse(localStorage.getItem(`sleep_${activePatient.id}`) || "[]"));
      }

      setDataLoading(false);
    };
    loadAll();
  }, [activePatient?.id]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".health-header", { opacity: 0, y: 20, duration: 0.5, ease: "power3.out" });
      gsap.from(".health-content", { opacity: 0, y: 30, duration: 0.5, ease: "power2.out", delay: 0.2 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const contentRef = useRef(null);
  useEffect(() => {
    const el = contentRef.current;
    if (el) gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" });
  }, [activeTab]);

  // ─── Milestone CRUD ───
  const handleToggleMilestone = async (m) => {
    const now = new Date().toISOString();
    const isCompleted = milestones[m.key]?.completed || milestones[m.id]?.completed;

    if (!isCompleted) {
      setCrudLoading(true);
      try {
        const created = await api("/health/milestones", {
          method: "POST",
          body: JSON.stringify({ child_id: activePatient.id, title: m.label || m.key, category: m.category || "General", age_months: m.age_months || 0 }),
        });
        setMilestoneLogs(prev => [created, ...prev]);
        setMilestones(prev => ({ ...prev, [m.key || created.id]: { completed: true, ...created } }));
        localStorage.setItem(`milestones_${activePatient.id}`, JSON.stringify([created, ...milestoneLogs]));
        showToast({ title: "Milestone Achieved", type: "success" });
      } catch (err) {
        showToast({ title: "Failed", description: err.message, type: "error" });
      } finally { setCrudLoading(false); }
    } else {
      // Find the log entry to delete
      const logEntry = milestoneLogs.find(l => l.title === m.label || l.id === m.key);
      if (logEntry) {
        setCrudLoading(true);
        try {
          await api(`/health/milestones/${logEntry.id}`, { method: "DELETE" });
          setMilestoneLogs(prev => prev.filter(l => l.id !== logEntry.id));
          setMilestones(prev => { const n = { ...prev }; delete n[m.key]; delete n[logEntry.id]; return n; });
          showToast({ title: "Milestone Removed", type: "success" });
        } catch (err) {
          showToast({ title: "Failed", description: err.message, type: "error" });
        } finally { setCrudLoading(false); }
      }
    }
  };

  const handleSaveMilestone = async () => {
    if (!activePatient?.id) return;
    if (!milestoneForm.label.trim()) {
      showToast({ title: "Validation Error", description: "Milestone name is required.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      if (editingMilestone) {
        await api(`/health/milestones/${editingMilestone.id}`, {
          method: "PATCH",
          body: JSON.stringify({ title: milestoneForm.label, category: milestoneForm.category, age_months: parseInt(milestoneForm.age_months) || 0 }),
        });
        setMilestoneLogs(prev => prev.map(m => m.id === editingMilestone.id ? { ...m, title: milestoneForm.label, category: milestoneForm.category, age_months: parseInt(milestoneForm.age_months) || 0 } : m));
        showToast({ title: "Milestone Updated", type: "success" });
      } else {
        const created = await api("/health/milestones", {
          method: "POST",
          body: JSON.stringify({ child_id: activePatient.id, title: milestoneForm.label, category: milestoneForm.category, age_months: parseInt(milestoneForm.age_months) || 0 }),
        });
        setMilestoneLogs(prev => [created, ...prev]);
        showToast({ title: "Milestone Added", type: "success" });
      }
      setMilestoneForm({ label: "", category: "Social", age_months: "" });
      setShowMilestoneForm(false);
      setEditingMilestone(null);
    } catch (err) {
      showToast({ title: "Failed", description: err.message, type: "error" });
    } finally { setSaving(false); }
  };

  const handleDeleteMilestone = async (id) => {
    setCrudLoading(true);
    try {
      await api(`/health/milestones/${id}`, { method: "DELETE" });
      setMilestoneLogs(prev => prev.filter(m => m.id !== id));
      setMilestones(prev => { const n = { ...prev }; delete n[id]; return n; });
      showToast({ title: "Milestone Deleted", type: "success" });
    } catch (err) {
      showToast({ title: "Failed", description: err.message, type: "error" });
    } finally { setCrudLoading(false); }
  };

  // ─── Growth CRUD ───
  const handleGrowthFormChange = (key, value) => setGrowthForm(prev => ({ ...prev, [key]: value }));
  const handleSaveGrowth = async () => {
    if (!activePatient?.id) return;
    const w = parseFloat(growthForm.weight_kg);
    const h = parseFloat(growthForm.height_cm);
    const hc = parseFloat(growthForm.head_cm);
    if (!w && !h && !hc) {
      showToast({ title: "Validation Error", description: "Please enter at least one measurement.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      if (editingGrowth) {
        const updated = await api(`/health/growth/${editingGrowth.id}`, {
          method: "PATCH",
          body: JSON.stringify({ weight_kg: w || null, height_cm: h || null, head_cm: hc || null }),
        });
        setGrowthLogs(prev => prev.map(g => g.id === editingGrowth.id ? { ...g, ...updated } : g));
        showToast({ title: "Growth Record Updated", type: "success" });
      } else {
        const created = await api("/health/growth", {
          method: "POST",
          body: JSON.stringify({ child_id: activePatient.id, weight_kg: w || null, height_cm: h || null, head_cm: hc || null }),
        });
        setGrowthLogs(prev => [created, ...prev]);
        localStorage.setItem(`growth_${activePatient.id}`, JSON.stringify([created, ...growthLogs]));
        showToast({ title: "Growth Record Saved", type: "success" });
      }
      setGrowthForm({ weight_kg: "", height_cm: "", head_cm: "" });
      setShowGrowthForm(false);
      setEditingGrowth(null);
    } catch (err) {
      showToast({ title: "Failed", description: err.message, type: "error" });
    } finally { setSaving(false); }
  };

  const handleDeleteGrowth = async (id) => {
    setCrudLoading(true);
    try {
      await api(`/health/growth/${id}`, { method: "DELETE" });
      setGrowthLogs(prev => prev.filter(g => g.id !== id));
      showToast({ title: "Growth Record Deleted", type: "success" });
    } catch (err) {
      showToast({ title: "Failed", description: err.message, type: "error" });
    } finally { setCrudLoading(false); }
  };

  // ─── Sleep CRUD ───
  const handleSleepFormChange = (key, value) => setSleepForm(prev => ({ ...prev, [key]: value }));
  const handleSaveSleep = async () => {
    if (!activePatient?.id) return;
    if (!sleepForm.start_time || !sleepForm.end_time) {
      showToast({ title: "Validation Error", description: "Bedtime and wake times are required.", type: "error" });
      return;
    }
    const start = new Date(sleepForm.start_time);
    const end = new Date(sleepForm.end_time);
    if (end <= start) {
      showToast({ title: "Validation Error", description: "Wake up time must be after bedtime.", type: "error" });
      return;
    }
    setSaving(true);
    const durationHours = Math.max(0, (end - start) / (1000 * 60 * 60));
    try {
      if (editingSleep) {
        const updated = await api(`/health/sleep/${editingSleep.id}`, {
          method: "PATCH",
          body: JSON.stringify({ start_time: sleepForm.start_time, end_time: sleepForm.end_time, quality: sleepForm.quality, notes: sleepForm.notes, duration_hours: durationHours }),
        });
        setSleepLogs(prev => prev.map(s => s.id === editingSleep.id ? { ...s, ...updated } : s));
        showToast({ title: "Sleep Log Updated", type: "success" });
      } else {
        const created = await api("/health/sleep", {
          method: "POST",
          body: JSON.stringify({ child_id: activePatient.id, start_time: sleepForm.start_time, end_time: sleepForm.end_time, quality: sleepForm.quality, notes: sleepForm.notes, duration_hours: durationHours }),
        });
        setSleepLogs(prev => [created, ...prev]);
        showToast({ title: "Sleep Log Saved", type: "success" });
      }
      setSleepForm({ start_time: "", end_time: "", quality: "good", notes: "" });
      setShowSleepForm(false);
      setEditingSleep(null);
    } catch (err) {
      showToast({ title: "Failed", description: err.message, type: "error" });
    } finally { setSaving(false); }
  };

  const handleDeleteSleep = async (id) => {
    setCrudLoading(true);
    try {
      await api(`/health/sleep/${id}`, { method: "DELETE" });
      setSleepLogs(prev => prev.filter(s => s.id !== id));
      showToast({ title: "Sleep Log Deleted", type: "success" });
    } catch (err) {
      showToast({ title: "Failed", description: err.message, type: "error" });
    } finally { setCrudLoading(false); }
  };

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="health-header flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-xl transition-colors hover:bg-white/5" style={{ color: "var(--text-secondary)" }} onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Health Tracker</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{activePatient?.name} &middot; {ageMonths} months old</p>
          </div>
        </div>
        <button onClick={() => { setEditingMilestone(null); setMilestoneForm({ label: "", category: "Social", age_months: "" }); setShowMilestoneForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border hover:bg-blue-500/10 hover:border-blue-500/30"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text-primary)" }}>
          Add Milestone
        </button>
      </div>

      {showMilestoneForm && (
        <div className="p-6 rounded-2xl border backdrop-blur-sm shadow-xl relative" style={{ background: "rgba(17, 24, 39, 0.7)", borderColor: "rgba(59, 130, 246, 0.3)" }}>
          <button onClick={() => { setShowMilestoneForm(false); setEditingMilestone(null); }} className="absolute top-4 right-4 p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all"><X className="w-5 h-5" /></button>
          <h3 className="text-lg font-bold mb-5 text-white">{editingMilestone ? "Edit Milestone" : "Add New Milestone"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Milestone Name" value={milestoneForm.label} onChange={(e) => setMilestoneForm({...milestoneForm, label: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all" />
            <select value={milestoneForm.category} onChange={(e) => setMilestoneForm({...milestoneForm, category: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all">
              <option value="Social" className="bg-neutral-800">Social</option>
              <option value="Motor" className="bg-neutral-800">Motor</option>
              <option value="Language" className="bg-neutral-800">Language</option>
              <option value="Vision" className="bg-neutral-800">Vision</option>
            </select>
            <input type="number" placeholder="Age (months)" value={milestoneForm.age_months} onChange={(e) => setMilestoneForm({...milestoneForm, age_months: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => { setShowMilestoneForm(false); setEditingMilestone(null); }} className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
            <button onClick={handleSaveMilestone} disabled={saving} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-900/20 transition-all">
              {saving ? "Saving..." : editingMilestone ? "Update" : "Save Milestone"}
            </button>
          </div>
        </div>
      )}

      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <div ref={contentRef} className="health-content">
        {dataLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-5 rounded-2xl border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ background: "var(--hover-bg)" }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/2 rounded-lg" style={{ background: "var(--hover-bg)" }} />
                    <div className="h-3 w-1/3 rounded" style={{ background: "var(--hover-bg)" }} />
                  </div>
                  <div className="w-16 h-8 rounded-xl" style={{ background: "var(--hover-bg)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {activeTab === "milestones" && (
              <MilestoneSection milestones={milestones} ageMonths={ageMonths} onToggle={handleToggleMilestone}
                milestoneLogs={milestoneLogs} loading={dataLoading}
                onEdit={(m) => { setEditingMilestone(m); setMilestoneForm({ label: m.title || "", category: m.category || "Social", age_months: String(m.age_months || "") }); setShowMilestoneForm(true); }}
                onDelete={handleDeleteMilestone} />
            )}
            {activeTab === "growth" && (
              <GrowthChartSection growthLogs={growthLogs} showForm={showGrowthForm} form={growthForm} onFormChange={handleGrowthFormChange} onSave={handleSaveGrowth}
                onToggleForm={() => { setShowGrowthForm(p => !p); setEditingGrowth(null); setGrowthForm({ weight_kg: "", height_cm: "", head_cm: "" }); }} saving={saving} loading={dataLoading}
                onEdit={(g) => { setEditingGrowth(g); setGrowthForm({ weight_kg: g.weight_kg || "", height_cm: g.height_cm || "", head_cm: g.head_cm || "" }); setShowGrowthForm(true); }}
                onDelete={handleDeleteGrowth} />
            )}
            {activeTab === "sleep" && (
              <SleepLogSection sleepLogs={sleepLogs} showForm={showSleepForm} form={sleepForm} onFormChange={handleSleepFormChange} onSave={handleSaveSleep}
                onToggleForm={() => { setShowSleepForm(p => !p); setEditingSleep(null); setSleepForm({ start_time: "", end_time: "", quality: "good", notes: "" }); }} saving={saving} loading={dataLoading}
                onEdit={(s) => { setEditingSleep(s); setSleepForm({ start_time: s.start_time || "", end_time: s.end_time || "", quality: s.quality || "good", notes: s.notes || "" }); setShowSleepForm(true); }}
                onDelete={handleDeleteSleep} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default HealthTrackerPage;
