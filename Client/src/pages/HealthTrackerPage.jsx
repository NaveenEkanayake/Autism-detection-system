import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ArrowLeft, Activity, TrendingUp, Moon, X } from "lucide-react";
import { usePatients } from "../hooks/PatientsContext";
import TabBar from "../components/Health/TabBar";
import MilestoneSection from "../components/Health/MilestoneSection";
import GrowthChartSection from "../components/Health/GrowthChartSection";
import SleepLogSection from "../components/Health/SleepLogSection";

const TABS = [
  { id: "milestones", label: "Milestones", icon: Activity },
  { id: "growth", label: "Growth", icon: TrendingUp },
  { id: "sleep", label: "Sleep", icon: Moon },
];

const INITIAL_MILESTONES = {
  social_smile: { completed: true, recorded_at: "2026-03-01" },
  head_control: { completed: true, recorded_at: "2026-03-15" },
  follows_object: { completed: true, recorded_at: "2026-04-10" },
  reaches_objects: { completed: false },
  first_laugh: { completed: true, recorded_at: "2026-04-20" },
  sits_supported: { completed: false },
  babbling: { completed: true, recorded_at: "2026-05-01" },
  stranger_anxiety: { completed: false },
  pincer_grasp: { completed: false },
  crawling: { completed: false },
  first_words: { completed: false },
  walks_alone: { completed: false },
  points_objects: { completed: false },
  gestures: { completed: false },
  understands_commands: { completed: false },
  stacks_blocks: { completed: false },
  says_phrases: { completed: false },
  runs_stiffly: { completed: false },
  feeds_self: { completed: false },
  climbs_furniture: { completed: false },
  recognizes_colors: { completed: false },
  two_words: { completed: false },
  runs_well: { completed: false },
  parallel_play: { completed: false },
  jumps: { completed: false },
  dresses_self: { completed: false },
  washes_hands: { completed: false },
  speaks_sentences: { completed: false },
  pedals_tricycle: { completed: false },
  imaginary_play: { completed: false },
  new_milestone: { completed: false },
  follows_rules: { completed: false },
  hops_one_foot: { completed: false },
  counts: { completed: false },
  brushes_teeth: { completed: false },
  draws_person: { completed: false },
  cooperative_play: { completed: false },
  writes_name: { completed: false },
  ties_shoes: { completed: false },
  reads_words: { completed: false },
  understands_time: { completed: false },
};

const INITIAL_GROWTH = [
  { id: "g1", weight_kg: 7.5, height_cm: 68, head_cm: 44, recorded_at: "2026-04-01T10:00:00Z" },
  { id: "g2", weight_kg: 8.2, height_cm: 71, head_cm: 45, recorded_at: "2026-05-01T10:00:00Z" },
  { id: "g3", weight_kg: 8.8, height_cm: 73, head_cm: 45.5, recorded_at: "2026-06-01T10:00:00Z" },
];

const INITIAL_SLEEP = [
  { id: "s1", start_time: "2026-06-01T21:00:00", end_time: "2026-06-02T07:00:00", duration_hours: 10, quality: "good", notes: "", recorded_at: "2026-06-02T07:00:00Z" },
  { id: "s2", start_time: "2026-06-02T21:30:00", end_time: "2026-06-03T06:30:00", duration_hours: 9, quality: "fair", notes: "Woke up once", recorded_at: "2026-06-03T06:30:00Z" },
];

function HealthTrackerPage() {
  const navigate = useNavigate();
  const { activePatient, getAgeMonths } = usePatients();
  const ageMonths = activePatient ? getAgeMonths(activePatient.dob) : 0;
  const containerRef = useRef(null);

  const [activeTab, setActiveTab] = useState("milestones");
  const [milestones, setMilestones] = useState(() => {
    const saved = localStorage.getItem("milestones");
    return saved ? JSON.parse(saved) : INITIAL_MILESTONES;
  });
  const [growthLogs, setGrowthLogs] = useState(() => {
    const saved = localStorage.getItem("growthLogs");
    return saved ? JSON.parse(saved) : INITIAL_GROWTH;
  });
  const [sleepLogs, setSleepLogs] = useState(() => {
    const saved = localStorage.getItem("sleepLogs");
    return saved ? JSON.parse(saved) : INITIAL_SLEEP;
  });

  useEffect(() => {
    localStorage.setItem("milestones", JSON.stringify(milestones));
  }, [milestones]);

  useEffect(() => {
    localStorage.setItem("growthLogs", JSON.stringify(growthLogs));
  }, [growthLogs]);

  useEffect(() => {
    localStorage.setItem("sleepLogs", JSON.stringify(sleepLogs));
  }, [sleepLogs]);
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

  const handleToggleMilestone = (m) => {
    setMilestones((prev) => ({
      ...prev,
      [m.key]: prev[m.key]?.completed ? {} : { completed: true, recorded_at: new Date().toISOString() },
    }));
  };

  const handleGrowthFormChange = (key, value) => setGrowthForm((prev) => ({ ...prev, [key]: value }));
  const handleSaveGrowth = () => {
    setSaving(true);
    setTimeout(() => {
      setGrowthLogs((prev) => [
        ...prev,
        { id: Date.now().toString(), weight_kg: parseFloat(growthForm.weight_kg) || 0, height_cm: parseFloat(growthForm.height_cm) || 0, head_cm: parseFloat(growthForm.head_cm) || 0, recorded_at: new Date().toISOString() },
      ]);
      setGrowthForm({ weight_kg: "", height_cm: "", head_cm: "" });
      setShowGrowthForm(false);
      setSaving(false);
    }, 500);
  };

  const handleSleepFormChange = (key, value) => setSleepForm((prev) => ({ ...prev, [key]: value }));
  const handleSaveSleep = () => {
    setSaving(true);
    setTimeout(() => {
      const start = new Date(sleepForm.start_time);
      const end = new Date(sleepForm.end_time);
      const durationHours = (end - start) / (1000 * 60 * 60);
      setSleepLogs((prev) => [
        { id: Date.now().toString(), start_time: sleepForm.start_time, end_time: sleepForm.end_time, duration_hours: durationHours > 0 ? durationHours : 0, quality: sleepForm.quality, notes: sleepForm.notes, recorded_at: new Date().toISOString() },
        ...prev,
      ]);
      setSleepForm({ start_time: "", end_time: "", quality: "good", notes: "" });
      setShowSleepForm(false);
      setSaving(false);
    }, 500);
  };

  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ label: "", category: "Social", age_months: "" });

  const handleSaveMilestone = () => {
    setSaving(true);
    setTimeout(() => {
      // In a real app, you would add this to the MILESTONES list or state
      alert(`Milestone "${milestoneForm.label}" added!`);
      setMilestoneForm({ label: "", category: "Social", age_months: "" });
      setShowMilestoneForm(false);
      setSaving(false);
    }, 500);
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
