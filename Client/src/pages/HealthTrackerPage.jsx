import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ArrowLeft, Activity, TrendingUp, Moon, X } from "lucide-react";
import { usePatients } from "../hooks/usePatients";
import { api } from "../lib/api";
import { showToast } from "../components/ui/toast";
import TabBar from "../components/Health/TabBar";
import MilestoneSection from "../components/Health/MilestoneSection";
import GrowthChartSection from "../components/Health/GrowthChartSection";
import SleepLogSection from "../components/Health/SleepLogSection";

const TABS = [
  { id: "milestones", label: "Milestones", icon: Activity },
  { id: "growth", label: "Growth", icon: TrendingUp },
  { id: "sleep", label: "Sleep", icon: Moon },
];

function HealthTrackerPage() {
  const navigate = useNavigate();
  const { activePatient, getAgeMonths } = usePatients();
  const ageMonths = activePatient ? getAgeMonths(activePatient.dob) : 0;
  const containerRef = useRef(null);

  const [activeTab, setActiveTab] = useState("milestones");
  const [milestones, setMilestones] = useState({});
  const [growthLogs, setGrowthLogs] = useState([]);
  const [sleepLogs, setSleepLogs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch health data from backend
  useEffect(() => {
    if (!activePatient?.id) {
      setDataLoading(false);
      return;
    }
    setDataLoading(true);
    Promise.all([
      api(`/health/milestones/${activePatient.id}`).catch(() => []),
      api(`/health/growth/${activePatient.id}`).catch(() => []),
      api(`/health/sleep/${activePatient.id}`).catch(() => []),
    ])
      .then(([milestonesData, growthData, sleepData]) => {
        // Convert milestones array to object for compatibility
        const milestonesObj = {};
        (milestonesData || []).forEach((m) => {
          milestonesObj[m.id] = { completed: true, recorded_at: m.date };
        });
        setMilestones(milestonesObj);
        setGrowthLogs(growthData || []);
        setSleepLogs(sleepData || []);
      })
      .catch((err) => {
        console.error("Failed to fetch health data:", err);
      })
      .finally(() => setDataLoading(false));
  }, [activePatient?.id]);
  const [showGrowthForm, setShowGrowthForm] = useState(false);
  const [showSleepForm, setShowSleepForm] = useState(false);
  const [growthForm, setGrowthForm] = useState({ weight_kg: "", height_cm: "", head_cm: "" });
  const [sleepForm, setSleepForm] = useState({ start_time: "", end_time: "", quality: "good", notes: "" });
  const [saving, setSaving] = useState(false);

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
    if (el) {
      gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" });
    }
  }, [activeTab]);

  const handleToggleMilestone = async (m) => {
    const now = new Date().toISOString();
    const isCompleted = milestones[m.key]?.completed;

    if (!isCompleted && activePatient?.id) {
      try {
        await api("/health/milestones", {
          method: "POST",
          body: JSON.stringify({
            patientId: activePatient.id,
            title: m.label || m.key,
            category: m.category || "general",
            date: now,
          }),
        });
      } catch (err) {
        console.error("Failed to save milestone:", err);
        showToast({ title: "Failed to save milestone", type: "error" });
        return;
      }
    }

    setMilestones((prev) => ({
      ...prev,
      [m.key]: prev[m.key]?.completed ? {} : { completed: true, recorded_at: now },
    }));
  };

  const handleGrowthFormChange = (key, value) => setGrowthForm((prev) => ({ ...prev, [key]: value }));
  const handleSaveGrowth = async () => {
    if (!activePatient?.id) return;
    setSaving(true);
    try {
      const newRecord = await api("/health/growth", {
        method: "POST",
        body: JSON.stringify({
          patientId: activePatient.id,
          date: new Date().toISOString(),
          weight: parseFloat(growthForm.weight_kg) || null,
          height: parseFloat(growthForm.height_cm) || null,
          headCircumference: parseFloat(growthForm.head_cm) || null,
        }),
      });
      setGrowthLogs((prev) => [
        ...prev,
        newRecord,
      ]);
      setGrowthForm({ weight_kg: "", height_cm: "", head_cm: "" });
      setShowGrowthForm(false);
      showToast({ title: "Growth record saved", type: "success" });
    } catch (err) {
      showToast({ title: "Failed to save growth", description: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSleepFormChange = (key, value) => setSleepForm((prev) => ({ ...prev, [key]: value }));
  const handleSaveSleep = async () => {
    if (!activePatient?.id) return;
    setSaving(true);
    try {
      const start = new Date(sleepForm.start_time);
      const end = new Date(sleepForm.end_time);
      const newRecord = await api("/health/sleep", {
        method: "POST",
        body: JSON.stringify({
          patientId: activePatient.id,
          date: start.toISOString(),
          bedtime: sleepForm.start_time,
          wakeTime: sleepForm.end_time,
          quality: sleepForm.quality,
          naps: 0,
        }),
      });
      setSleepLogs((prev) => [newRecord, ...prev]);
      setSleepForm({ start_time: "", end_time: "", quality: "good", notes: "" });
      setShowSleepForm(false);
      showToast({ title: "Sleep log saved", type: "success" });
    } catch (err) {
      showToast({ title: "Failed to save sleep log", description: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ label: "", category: "Social", age_months: "" });

  const handleSaveMilestone = async () => {
    if (!activePatient?.id) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await api("/health/milestones", {
        method: "POST",
        body: JSON.stringify({
          patientId: activePatient.id,
          title: milestoneForm.label,
          category: milestoneForm.category,
          date: now,
        }),
      });

      // Update local milestones state so it reflects immediately
      setMilestones((prev) => ({
        ...prev,
        [milestoneForm.label.toLowerCase().replace(/\s+/g, "_")]: {
          completed: true,
          recorded_at: now
        }
      }));

      setMilestoneForm({ label: "", category: "Social", age_months: "" });
      setShowMilestoneForm(false);
      showToast({ title: "Custom milestone saved!", type: "success" });
    } catch (err) {
      console.error("Failed to save milestone:", err);
      showToast({ title: "Failed to save milestone", description: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
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
        <button
          onClick={() => setShowMilestoneForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border hover:bg-blue-500/10 hover:border-blue-500/30"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text-primary)" }}
        >
          Add Milestone
        </button>
      </div>

      {showMilestoneForm && (
        <div className="p-6 rounded-2xl border backdrop-blur-sm shadow-xl relative" style={{ background: "rgba(17, 24, 39, 0.7)", borderColor: "rgba(59, 130, 246, 0.3)" }}>
          <button 
            onClick={() => setShowMilestoneForm(false)} 
            className="absolute top-4 right-4 p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold mb-5 text-white">Add New Milestone</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              placeholder="Milestone Name" 
              value={milestoneForm.label}
              onChange={(e) => setMilestoneForm({...milestoneForm, label: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
            <select
              value={milestoneForm.category}
              onChange={(e) => setMilestoneForm({...milestoneForm, category: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            >
              <option value="Social" className="bg-neutral-800">Social</option>
              <option value="Motor" className="bg-neutral-800">Motor</option>
              <option value="Language" className="bg-neutral-800">Language</option>
              <option value="Vision" className="bg-neutral-800">Vision</option>
            </select>
            <input 
              type="number"
              placeholder="Age (months)"
              value={milestoneForm.age_months}
              onChange={(e) => setMilestoneForm({...milestoneForm, age_months: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={() => setShowMilestoneForm(false)} 
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveMilestone} 
              disabled={saving} 
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-900/20 transition-all"
            >
              {saving ? "Saving..." : "Save Milestone"}
            </button>
          </div>
        </div>
      )}

      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <div ref={contentRef} className="health-content">
        {activeTab === "milestones" && (
          <MilestoneSection milestones={milestones} ageMonths={ageMonths} onToggle={handleToggleMilestone} />
        )}
        {activeTab === "growth" && (
          <GrowthChartSection
            growthLogs={growthLogs}
            showForm={showGrowthForm}
            form={growthForm}
            onFormChange={handleGrowthFormChange}
            onSave={handleSaveGrowth}
            onToggleForm={() => setShowGrowthForm((p) => !p)}
            saving={saving}
          />
        )}
        {activeTab === "sleep" && (
          <SleepLogSection
            sleepLogs={sleepLogs}
            showForm={showSleepForm}
            form={sleepForm}
            onFormChange={handleSleepFormChange}
            onSave={handleSaveSleep}
            onToggleForm={() => setShowSleepForm((p) => !p)}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

export default HealthTrackerPage;
