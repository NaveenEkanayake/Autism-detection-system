import { AlertTriangle } from "lucide-react";

const CATEGORY_COLORS = {
  Social: { bg: "rgba(59,147,245,0.15)", text: "#60a5fa", border: "rgba(59,147,245,0.3)" },
  Motor: { bg: "rgba(20,184,166,0.15)", text: "#2dd4bf", border: "rgba(20,184,166,0.3)" },
  Language: { bg: "rgba(34,211,238,0.15)", text: "#22d3ee", border: "rgba(34,211,238,0.3)" },
  Vision: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24", border: "rgba(245,158,11,0.3)" },
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
  { key: "crawling", label: "Crawling on hands and knees", category: "Motor", age_months: 10 },
  { key: "first_words", label: "First words", category: "Language", age_months: 12 },
  { key: "walks_alone", label: "Walks alone", category: "Motor", age_months: 12 },
  { key: "points_objects", label: "Points to objects of interest", category: "Social", age_months: 12 },
  { key: "gestures", label: "Uses gestures (waving, pointing)", category: "Social", age_months: 12 },
  { key: "understands_commands", label: "Follows simple commands", category: "Language", age_months: 15 },
  { key: "stacks_blocks", label: "Stacks blocks / objects", category: "Motor", age_months: 18 },
  { key: "says_phrases", label: "Says short phrases", category: "Language", age_months: 18 },
  { key: "runs_stiffly", label: "Runs (stiffly at first)", category: "Motor", age_months: 18 },
  { key: "feeds_self", label: "Feeds self with spoon", category: "Motor", age_months: 18 },
  { key: "climbs_furniture", label: "Climbs onto furniture", category: "Motor", age_months: 18 },
  { key: "recognizes_colors", label: "Recognizes colors and shapes", category: "Vision", age_months: 24 },
  { key: "two_words", label: "Two-word phrases", category: "Language", age_months: 24 },
  { key: "runs_well", label: "Runs well", category: "Motor", age_months: 24 },
  { key: "parallel_play", label: "Parallel play", category: "Social", age_months: 24 },
  { key: "jumps", label: "Jumps with both feet off ground", category: "Motor", age_months: 30 },
  { key: "dresses_self", label: "Dresses self with help", category: "Motor", age_months: 30 },
  { key: "washes_hands", label: "Washes and dries hands", category: "Social", age_months: 30 },
  { key: "speaks_sentences", label: "Speaks in short sentences", category: "Language", age_months: 36 },
  { key: "pedals_tricycle", label: "Pedals a tricycle", category: "Motor", age_months: 36 },
  { key: "imaginary_play", label: "Engages in imaginary play", category: "Social", age_months: 36 },
  { key: "new_milestone", label: "New Milestone", category: "Social", age_months: 6 },
  { key: "follows_rules", label: "Follows simple game rules", category: "Social", age_months: 42 },
  { key: "hops_one_foot", label: "Hops on one foot", category: "Motor", age_months: 48 },
  { key: "counts", label: "Counts up to 10", category: "Language", age_months: 48 },
  { key: "brushes_teeth", label: "Brushes teeth with help", category: "Social", age_months: 48 },
  { key: "draws_person", label: "Draws a person with 3+ body parts", category: "Motor", age_months: 48 },
  { key: "cooperative_play", label: "Cooperative play with peers", category: "Social", age_months: 48 },
  { key: "writes_name", label: "Writes first name", category: "Motor", age_months: 54 },
  { key: "ties_shoes", label: "Ties shoelaces", category: "Motor", age_months: 60 },
  { key: "reads_words", label: "Reads simple words", category: "Language", age_months: 60 },
  { key: "understands_time", label: "Understands time concepts", category: "Social", age_months: 60 },
];

export default function MilestoneSection({ milestones, ageMonths, onToggle }) {
  const relevant = MILESTONES.filter((m) => m.age_months <= ageMonths + 3);
  const completedCount = relevant.filter((m) => milestones[m.key]?.completed).length;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="p-5 flex items-center justify-between rounded-2xl border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <div>
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Developmental Milestones</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>CDC-aligned age-indexed checklist</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            {completedCount}/{relevant.length}
          </span>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>completed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {relevant.map((m) => {
          const done = milestones[m.key]?.completed;
          const overdue = !done && m.age_months < ageMonths - 2;
          const catColor = CATEGORY_COLORS[m.category];
          const borderColor = done ? "rgba(20,184,166,0.3)" : overdue ? "rgba(245,158,11,0.2)" : "var(--card-border)";
          return (
            <button
              key={m.key}
              onClick={() => onToggle(m)}
              className="p-4 text-left transition-all duration-200 hover:scale-[1.01] rounded-2xl border"
              style={{ background: done ? "rgba(20,184,166,0.06)" : "var(--card-bg)", borderColor }}
            >
              <div className="flex items-center gap-3">
                <div className={"w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all " + (done ? "border-teal-500 bg-teal-500" : "")} style={done ? {} : { borderColor: "rgba(255,255,255,0.2)" }}>
                  {done && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: done ? "#2dd4bf" : "var(--text-primary)" }}>{m.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={catColor}>{m.category}</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{m.age_months}m</span>
                    {overdue && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}>
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
