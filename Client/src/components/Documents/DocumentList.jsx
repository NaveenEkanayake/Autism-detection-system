import { FolderOpen } from "lucide-react";
import DocumentItem from "./DocumentItem";

export default function DocumentList({ documents, loading, onDelete }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-4 animate-pulse">
            <div className="h-4 bg-white/5 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="glass-card p-10 text-center border-dashed border-white/10">
        <FolderOpen className="w-10 h-10 text-slate-700 mx-auto mb-3" />
        <p className="text-slate-500">No documents uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <DocumentItem key={doc.id} doc={doc} onDelete={onDelete} />
      ))}
    </div>
  );
}
