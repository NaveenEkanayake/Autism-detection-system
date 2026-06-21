import { Plus, X, Moon, Clock } from "lucide-react";

const QUALITY_COLORS = {
  excellent: { bg: "rgba(34,197,94,0.15)", text: "#4ade80" },
  good: { bg: "rgba(20,184,166,0.15)", text: "#2dd4bf" },
  fair: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24" },
  poor: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
};

export default function SleepLogSection({ sleepLogs, showForm, form, onFormChange, onSave, onToggleForm, saving }) {
  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Sleep Log</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Daily sleep interval tracker</p>
        </div>
        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
          onClick={onToggleForm}
        >
          <Plus className="w-4 h-4" /> Log Sleep
        </button>
      </div>

      {showForm && (
        <div className="p-5 rounded-2xl border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium" style={{ color: "var(--text-primary)" }}>New Sleep Entry</h4>
            <button className="p-1 rounded-lg transition-colors hover:bg-white/5" style={{ color: "var(--text-muted)" }} onClick={onToggleForm}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>Sleep Start</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
                style={{ background: "var(--hover-bg)", color: "var(--text-primary)", border: "1px solid var(--card-border)" }}
                value={form.start_time}
                onChange={(e) => onFormChange("start_time", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>Sleep End</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
                style={{ background: "var(--hover-bg)", color: "var(--text-primary)", border: "1px solid var(--card-border)" }}
                value={form.end_time}
                onChange={(e) => onFormChange("end_time", e.target.value)}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs mb-2" style={{ color: "var(--text-secondary)" }}>Sleep Quality</label>
            <div className="flex gap-2">
              {["poor", "fair", "good", "excellent"].map((q) => {
                const active = form.quality === q;
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onFormChange("quality", q)}
                    className={"flex-1 py-2 rounded-lg text-xs font-medium capitalize border transition-all " + (active ? "border-blue-500 text-blue-300" : "")}
                    style={{ background: active ? "rgba(59,147,245,0.12)" : "var(--hover-bg)", borderColor: active ? undefined : "var(--card-border)", color: active ? undefined : "var(--text-muted)" }}
                  >
                    {q}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>Notes (optional)</label>
            <input
              className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
              style={{ background: "var(--hover-bg)", color: "var(--text-primary)", border: "1px solid var(--card-border)" }}
              placeholder="Any observations..."
              value={form.notes}
              onChange={(e) => onFormChange("notes", e.target.value)}
            />
          </div>
          <button
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Sleep Log"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {sleepLogs.length === 0 ? (
          <div className="p-10 text-center rounded-2xl border border-dashed" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
            <Moon className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-secondary)" }}>No sleep logs recorded yet.</p>
          </div>
        ) : (
          sleepLogs.map((log) => (
            <div key={log.id} className="p-4 rounded-2xl border flex items-center gap-4" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(59,147,245,0.15)" }}>
                <Moon className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {log.duration_hours ? parseFloat(log.duration_hours).toFixed(1) + " hours" : "N/A"}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={QUALITY_COLORS[log.quality] || { bg: "rgba(100,116,139,0.15)", text: "#94a3b8" }}>
                    {log.quality}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {new Date(log.start_time).toLocaleString()} -- {new Date(log.end_time).toLocaleTimeString()}
                </p>
                {log.notes && (
                  <p className="text-xs mt-1 italic" style={{ color: "var(--text-secondary)" }}>{log.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(log.recorded_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
