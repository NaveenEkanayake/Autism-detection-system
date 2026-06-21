import { CheckSquare, TrendingUp, Moon } from "lucide-react";

export default function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex gap-1 p-1 w-fit rounded-2xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
      {tabs.map(({ id, label }) => {
        const icons = { milestones: CheckSquare, growth: TrendingUp, sleep: Moon };
        const Icon = icons[id];
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={
              activeTab === id
                ? { background: "linear-gradient(135deg, rgba(59,147,245,0.3), rgba(20,184,166,0.2))", color: "white" }
                : { color: "#64748b" }
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
