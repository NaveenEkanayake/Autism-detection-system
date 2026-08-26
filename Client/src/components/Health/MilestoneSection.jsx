import { useState } from "react";
import { Edit2, Trash2, Plus, CheckCircle, AlertTriangle } from "lucide-react";

const CATEGORY_COLORS = {
  Social: { bg: "rgba(59,147,245,0.15)", text: "#60a5fa", border: "rgba(59,147,245,0.3)" },
  Motor: { bg: "rgba(20,184,166,0.15)", text: "#2dd4bf", border: "rgba(20,184,166,0.3)" },
  Language: { bg: "rgba(34,211,238,0.15)", text: "#22d3ee", border: "rgba(34,211,238,0.3)" },
  Vision: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24", border: "rgba(245,158,11,0.3)" },
  General: { bg: "rgba(100,116,139,0.15)", text: "#94a3b8", border: "rgba(100,116,139,0.3)" },
};

export default function MilestoneSection({ milestones, ageMonths, onToggle, milestoneLogs = [], onEdit, onDelete }) {
  const [filterCategory, setFilterCategory] = useState("all");

  // Use milestoneLogs from backend (not hardcoded list)
  const allLogs = milestoneLogs || [];

  const filteredLogs = filterCategory === "all"
    ? allLogs
    : allLogs.filter(m => m.category === filterCategory);

  const completedCount = allLogs.length;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="p-5 flex items-center justify-between rounded-2xl border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <div>
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Developmental Milestones</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Track and manage milestones achieved by your child</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            {completedCount}
          </span>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>achieved</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterCategory("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filterCategory === "all" ? "bg-blue-500/25 border-blue-500 text-blue-300" : "bg-transparent border-white/5 text-neutral-400 hover:text-white hover:bg-white/5"}`}>
          All
        </button>
        {Object.keys(CATEGORY_COLORS).filter(c => c !== "General").map((cat) => (
          <button key={cat} onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 ${filterCategory === cat ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white hover:bg-white/5"}`}
            style={{ borderColor: filterCategory === cat ? CATEGORY_COLORS[cat].border : "rgba(255,255,255,0.05)", color: filterCategory === cat ? CATEGORY_COLORS[cat].text : undefined }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat].text }} />
            {cat}
          </button>
        ))}
      </div>

      {/* Milestones Table */}
      {filteredLogs.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-dashed" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-secondary)" }}>
            {filterCategory === "all" ? "No milestones recorded yet. Use 'Add Milestone' above to create one." : `No ${filterCategory} milestones recorded.`}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          {/* Table Header */}
          <div className="px-5 py-3 grid grid-cols-12 gap-4 text-xs font-semibold uppercase tracking-wider" style={{ borderBottom: "1px solid var(--card-border)", color: "var(--text-muted)" }}>
            <div className="col-span-1">Status</div>
            <div className="col-span-4">Milestone</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Age (months)</div>
            <div className="col-span-2">Date Achieved</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Table Rows */}
          {filteredLogs.map((log, idx) => {
            const catColor = CATEGORY_COLORS[log.category] || CATEGORY_COLORS.General;
            const achievedDate = log.date || log.created_at;
            return (
              <div key={log.id}
                className="px-5 py-3.5 grid grid-cols-12 gap-4 items-center text-sm transition-colors hover:bg-white/[0.02]"
                style={idx < filteredLogs.length - 1 ? { borderBottom: "1px solid var(--card-border)" } : {}}>
                <div className="col-span-1">
                  <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <div className="col-span-4">
                  <p className="font-medium truncate" style={{ color: "var(--text-primary)" }}>{log.title}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: catColor.bg, color: catColor.text }}>
                    {log.category}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{log.age_months}m</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {achievedDate ? new Date(achievedDate).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <button onClick={() => onEdit?.(log)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-blue-400 transition-colors" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDelete?.(log.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
