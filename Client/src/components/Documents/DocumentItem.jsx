import { Download, Trash2, File } from "lucide-react";

const FILE_TYPES = {
  "application/pdf": { label: "PDF", color: "#f87171", bg: "rgba(248,113,113,0.15)" },
  "image/jpeg": { label: "JPG", color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
  "image/png": { label: "PNG", color: "#22d3ee", bg: "rgba(34,211,238,0.15)" },
  "video/mp4": { label: "MP4", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
  default: { label: "FILE", color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentItem({ doc, onDelete }) {
  const ft = FILE_TYPES[doc.type] || FILE_TYPES.default;

  return (
    <div className="p-4 flex items-center gap-4 rounded-2xl border transition-all hover:shadow-md" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: ft.bg }}>
        <File className="w-5 h-5" style={{ color: ft.color }} />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{doc.name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: ft.bg, color: ft.color }}>{ft.label}</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatSize(doc.size_bytes)}</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button className="p-2 rounded-xl transition-colors hover:bg-white/5" style={{ color: "var(--text-muted)" }}>
          <Download className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-xl transition-colors hover:bg-red-500/10 text-red-400" onClick={() => onDelete(doc.id)}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
