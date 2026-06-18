import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePatients } from "../hooks/usePatients";
import TabBar from "../components/Health/TabBar";
import MilestoneSection from "../components/Health/MilestoneSection";
import GrowthChartSection from "../components/Health/GrowthChartSection";
import SleepLogSection from "../components/Health/SleepLogSection";

const TABS = [
  { id: "milestones", label: "Milestones" },
  { id: "growth", label: "Growth" },
  { id: "sleep", label: "Sleep" },
];

const INITIAL_MILESTONES = {
  social_smile: { completed: true, recorded_at: "2026-03-01" },
  head_control: { completed: true, recorded_at: "2026-03-15" },
  follows_object: { completed: true, recorded_at: "2026-04-10" },
  reaches_objects: { completed: false },
  babbling: { completed: true, recorded_at: "2026-05-01" },
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
  const ageMonths = getAgeMonths(activePatient.dob);

  const [activeTab, setActiveTab] = useState("milestones");
  const [milestones, setMilestones] = useState(INITIAL_MILESTONES);
  const [growthLogs, setGrowthLogs] = useState(INITIAL_GROWTH);
  const [sleepLogs, setSleepLogs] = useState(INITIAL_SLEEP);
  const [showGrowthForm, setShowGrowthForm] = useState(false);
  const [showSleepForm, setShowSleepForm] = useState(false);
  const [growthForm, setGrowthForm] = useState({ weight_kg: "", height_cm: "", head_cm: "" });
  const [sleepForm, setSleepForm] = useState({ start_time: "", end_time: "", quality: "good", notes: "" });
  const [saving, setSaving] = useState(false);

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <button className="btn-ghost p-2 text-slate-500 hover:text-white" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Health Tracker</h1>
            <p className="text-slate-500 text-sm">{activePatient.name} &middot; {ageMonths} months old</p>
          </div>
        </div>

        <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

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
  );
}

export default HealthTrackerPage;
