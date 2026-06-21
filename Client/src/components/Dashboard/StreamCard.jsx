import { ChevronRight } from "lucide-react";

export default function StreamCard({ icon: Icon, title, desc, badge, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-6 text-left w-full group rounded-2xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ background: `rgba(${color}, 0.12)` }}
        >
          <Icon className="w-6 h-6" style={{ color: `rgb(${color})` }} />
        </div>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(59,147,245,0.15)", color: "#60a5fa" }}>
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{title}</h3>
      <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>{desc}</p>
      <span className="text-blue-400 text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
        Open <ChevronRight className="w-3 h-3" />
      </span>
    </button>
  );
}
