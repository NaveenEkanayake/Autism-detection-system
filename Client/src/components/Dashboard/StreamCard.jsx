import { ChevronRight } from "lucide-react";

export default function StreamCard({ icon: Icon, title, desc, badge, color, onClick }) {
  return (
    <button onClick={onClick} className="glass-card-hover p-6 text-left w-full group">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ background: `rgba(${color}, 0.12)` }}
        >
          <Icon className="w-6 h-6" style={{ color: `rgb(${color})` }} />
        </div>
        {badge && <span className="badge-blue text-xs">{badge}</span>}
      </div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-4">{desc}</p>
      <span className="text-blue-400 text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
        Open <ChevronRight className="w-3 h-3" />
      </span>
    </button>
  );
}
