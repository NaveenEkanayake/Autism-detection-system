import { AlertTriangle } from "lucide-react";

const CATEGORY_COLORS = {
  Social: "text-blue-400 bg-blue-500/15 border-blue-500/30",
  Motor: "text-teal-400 bg-teal-500/15 border-teal-500/30",
  Language: "text-cyan-400 bg-cyan-500/15 border-cyan-500/30",
  Vision: "text-amber-400 bg-amber-500/15 border-amber-500/30",
};

const MILESTONES = [
  { key: "social_smile", label: "Social smile", category: "Social", age_months: 2 },
  { key: "head_control", label: "Head control", category: "Motor", age_months: 3 },
  { key: "follows_object", label: "Follows moving object", category: "Vision", age_months: 3 },
  { key: "reaches_objects", label: "Reaches for objects", category: "Motor", age_months: 4 },
  { key: "first_laugh", label: "First laugh / giggle", category: "Social", age_months: 4 },
  { key: "sits_supported", label: "Sits with support", category: "Motor", age_months: 6 },
  { key: "babbling", label: "Babbling (ba, da, ma)", category: "Language", age_months: 6 },
  { key: "stranger_anxiety", label: "Stranger anxiety", category: "Social", age_months: 8 },
  { key: "pincer_grasp", label: "Pincer grasp", category: "Motor", age_months: 9 },
  { key: "first_words", label: "First words", category: "Language", age_months: 12 },
  { key: "walks_alone", label: "Walks alone", category: "Motor", age_months: 12 },
  { key: "points_objects", label: "Points to objects of interest", category: "Social", age_months: 12 },
  { key: "two_words", label: "Two-word phrases", category: "Language", age_months: 24 },
  { key: "runs_well", label: "Runs well", category: "Motor", age_months: 24 },
  { key: "parallel_play", label: "Parallel play", category: "Social", age_months: 24 },
];

export default function MilestoneSection({ milestones, ageMonths, onToggle }) {
  const relevant = MILESTONES.filter((m) => m.age_months <= ageMonths + 3);
  const completedCount = relevant.filter((m) => milestones[m.key]?.completed).length;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="glass-card p-5 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">Developmental Milestones</h3>
          <p className="text-slate-500 text-sm">CDC-aligned age-indexed checklist</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            {completedCount}/{relevant.length}
          </span>
          <p className="text-slate-500 text-xs">completed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {relevant.map((m) => {
          const done = milestones[m.key]?.completed;
          const overdue = !done && m.age_months < ageMonths - 2;
          const colors = CATEGORY_COLORS[m.category] || "";
          const btnClass = "glass-card p-4 text-left transition-all duration-200 hover:scale-[1.01] border " + (done ? "border-teal-500/30" : overdue ? "border-amber-500/20" : "border-white/8");
          const dotClass = "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all " + (done ? "border-teal-500 bg-teal-500" : "border-white/20");
          const labelClass = "text-sm font-medium " + (done ? "text-teal-200" : "text-white");
          return (
            <button
              key={m.key}
              onClick={() => onToggle(m)}
              className={btnClass}
              style={done ? { background: "rgba(20,184,166,0.06)" } : {}}
            >
              <div className="flex items-center gap-3">
                <div className={dotClass}>
                  {done && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </div>
                <div className="flex-1">
                  <p className={labelClass}>{m.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={"badge text-xs " + colors}>{m.category}</span>
                    <span className="text-slate-600 text-xs">{m.age_months}m</span>
                    {overdue && (
                      <span className="badge-amber text-xs">
                        <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
