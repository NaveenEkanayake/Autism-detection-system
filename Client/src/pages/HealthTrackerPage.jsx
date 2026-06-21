import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ArrowLeft, Activity, TrendingUp, Moon } from "lucide-react";
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

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="health-header flex items-center gap-4">
        <button className="p-2 rounded-xl transition-colors hover:bg-white/5" style={{ color: "var(--text-secondary)" }} onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Health Tracker</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{activePatient?.name} &middot; {ageMonths} months old</p>
        </div>
      </div>

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
