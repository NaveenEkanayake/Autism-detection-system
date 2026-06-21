import { Plus, X, BarChart2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 text-sm rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
        <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function GrowthChartSection({ growthLogs, showForm, form, onFormChange, onSave, onToggleForm, saving }) {
  const chartData = growthLogs.map((l, i) => ({
    name: "Log " + (i + 1),
    Weight: l.weight_kg,
    Height: l.height_cm,
  }));

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Growth Chart</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Weight and height over time</p>
        </div>
        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
          onClick={onToggleForm}
        >
          <Plus className="w-4 h-4" /> Log Measurement
        </button>
      </div>

      {showForm && (
        <div className="p-5 rounded-2xl border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium" style={{ color: "var(--text-primary)" }}>New Measurement</h4>
            <button className="p-1 rounded-lg transition-colors hover:bg-white/5" style={{ color: "var(--text-muted)" }} onClick={onToggleForm}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "weight_kg", label: "Weight (kg)", placeholder: "8.5" },
              { key: "height_cm", label: "Height (cm)", placeholder: "72" },
              { key: "head_cm", label: "Head circ. (cm)", placeholder: "46" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>{f.label}</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
                  style={{ background: "var(--hover-bg)", color: "var(--text-primary)", border: "1px solid var(--card-border)" }}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={(e) => onFormChange(f.key, e.target.value)}
                />
              </div>
            ))}
          </div>
          <button
            className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Measurement"}
          </button>
        </div>
      )}

      {chartData.length > 1 ? (
        <div className="p-5 rounded-2xl border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="Weight" stroke="#3b93f5" strokeWidth={2} dot={{ fill: "#3b93f5", r: 4 }} name="Weight (kg)" />
              <Line type="monotone" dataKey="Height" stroke="#14b8a6" strokeWidth={2} dot={{ fill: "#14b8a6", r: 4 }} name="Height (cm)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="p-10 text-center rounded-2xl border border-dashed" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <BarChart2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-secondary)" }}>Add at least 2 measurements to see the growth chart.</p>
        </div>
      )}

      {growthLogs.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--card-border)" }}>
            <h4 className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Measurement History</h4>
          </div>
          <div>
            {[...growthLogs].reverse().map((log, idx) => (
              <div key={log.id} className="px-5 py-3 flex items-center gap-6 text-sm" style={idx < growthLogs.length - 1 ? { borderBottom: "1px solid var(--card-border)" } : {}}>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(log.recorded_at).toLocaleDateString()}</span>
                {log.weight_kg && <span style={{ color: "var(--text-primary)" }}>{log.weight_kg} <span style={{ color: "var(--text-muted)" }}>kg</span></span>}
                {log.height_cm && <span style={{ color: "var(--text-primary)" }}>{log.height_cm} <span style={{ color: "var(--text-muted)" }}>cm</span></span>}
                {log.head_cm && <span style={{ color: "var(--text-primary)" }}>{log.head_cm} <span style={{ color: "var(--text-muted)" }}>cm HC</span></span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
