import { Download, Trash2, File } from "lucide-react";

const FILE_TYPES = {
  "application/pdf": { label: "PDF", color: "text-red-400", bg: "bg-red-500/15" },
  "image/jpeg": { label: "JPG", color: "text-blue-400", bg: "bg-blue-500/15" },
  "image/png": { label: "PNG", color: "text-cyan-400", bg: "bg-cyan-500/15" },
  "video/mp4": { label: "MP4", color: "text-amber-400", bg: "bg-amber-500/15" },
  default: { label: "FILE", color: "text-slate-400", bg: "bg-slate-500/15" },
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentItem({ doc, onDelete }) {
  const ft = FILE_TYPES[doc.type] || FILE_TYPES.default;

  return (
    <div className="glass-card-hover p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ft.bg}`}>
        <File className={`w-5 h-5 ${ft.color}`} />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="text-white text-sm font-medium truncate">{doc.name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className={`badge text-xs ${ft.bg} ${ft.color}`}>{ft.label}</span>
          <span className="text-slate-500 text-xs">{formatSize(doc.size_bytes)}</span>
          <span className="text-slate-600 text-xs">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button className="btn-ghost p-2 text-slate-500 hover:text-white">
          <Download className="w-4 h-4" />
        </button>
        <button className="btn-ghost p-2 text-slate-500 hover:text-red-400" onClick={() => onDelete(doc.id)}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
