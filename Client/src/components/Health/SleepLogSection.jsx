import { Plus, X, Moon, Clock } from "lucide-react";

const QUALITY_COLORS = {
  excellent: "badge-green",
  good: "badge-teal",
  fair: "badge-amber",
  poor: "badge-red",
};

export default function SleepLogSection({ sleepLogs, showForm, form, onFormChange, onSave, onToggleForm, saving }) {
  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">Sleep Log</h3>
          <p className="text-slate-500 text-sm">Daily sleep interval tracker</p>
        </div>
        <button className="btn-primary text-sm" onClick={onToggleForm}>
          <Plus className="w-4 h-4" /> Log Sleep
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">New Sleep Entry</h4>
            <button className="btn-ghost p-1" onClick={onToggleForm}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Sleep Start</label>
              <input
                type="datetime-local"
                className="input-glass"
                value={form.start_time}
                onChange={(e) => onFormChange("start_time", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Sleep End</label>
              <input
                type="datetime-local"
                className="input-glass"
                value={form.end_time}
                onChange={(e) => onFormChange("end_time", e.target.value)}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-2">Sleep Quality</label>
            <div className="flex gap-2">
              {["poor", "fair", "good", "excellent"].map((q) => {
                const active = form.quality === q;
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onFormChange("quality", q)}
                    className={"flex-1 py-2 rounded-lg text-xs font-medium capitalize border transition-all " + (active ? "border-blue-500 text-blue-300" : "border-white/10 text-slate-500")}
                    style={active ? { background: "rgba(59,147,245,0.12)" } : { background: "rgba(255,255,255,0.04)" }}
                  >
                    {q}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-1.5">Notes (optional)</label>
            <input
              className="input-glass"
              placeholder="Any observations..."
              value={form.notes}
              onChange={(e) => onFormChange("notes", e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save Sleep Log"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {sleepLogs.length === 0 ? (
          <div className="glass-card p-10 text-center border-dashed border-white/10">
            <Moon className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">No sleep logs recorded yet.</p>
          </div>
        ) : (
          sleepLogs.map((log) => (
            <div key={log.id} className="glass-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <Moon className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">
                    {log.duration_hours ? parseFloat(log.duration_hours).toFixed(1) + " hours" : "N/A"}
                  </span>
                  <span className={"badge text-xs " + (QUALITY_COLORS[log.quality] || "badge-slate")}>
                    {log.quality}
                  </span>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">
                  {new Date(log.start_time).toLocaleString()} -- {new Date(log.end_time).toLocaleTimeString()}
                </p>
                {log.notes && (
                  <p className="text-slate-400 text-xs mt-1 italic">{log.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-slate-500 text-xs">{new Date(log.recorded_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
