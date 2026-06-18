import { Plus, X, BarChart2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-sm">
        <p className="text-slate-400 text-xs mb-1">{label}</p>
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
          <h3 className="text-white font-semibold">Growth Chart</h3>
          <p className="text-slate-500 text-sm">Weight and height over time</p>
        </div>
        <button className="btn-primary text-sm" onClick={onToggleForm}>
          <Plus className="w-4 h-4" /> Log Measurement
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">New Measurement</h4>
            <button className="btn-ghost p-1" onClick={onToggleForm}>
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
                <label className="block text-xs text-slate-400 mb-1.5">{f.label}</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-glass"
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={(e) => onFormChange(f.key, e.target.value)}
                />
              </div>
            ))}
          </div>
          <button className="btn-primary mt-4" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save Measurement"}
          </button>
        </div>
      )}

      {chartData.length > 1 ? (
        <div className="glass-card p-5">
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
        <div className="glass-card p-10 text-center border-dashed border-white/10">
          <BarChart2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">Add at least 2 measurements to see the growth chart.</p>
        </div>
      )}

      {growthLogs.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h4 className="text-white font-medium text-sm">Measurement History</h4>
          </div>
          <div className="divide-y divide-white/5">
            {[...growthLogs].reverse().map((log) => (
              <div key={log.id} className="px-5 py-3 flex items-center gap-6 text-sm">
                <span className="text-slate-500 text-xs">{new Date(log.recorded_at).toLocaleDateString()}</span>
                {log.weight_kg && <span className="text-white">{log.weight_kg} <span className="text-slate-500">kg</span></span>}
                {log.height_cm && <span className="text-white">{log.height_cm} <span className="text-slate-500">cm</span></span>}
                {log.head_cm && <span className="text-white">{log.head_cm} <span className="text-slate-500">cm HC</span></span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
