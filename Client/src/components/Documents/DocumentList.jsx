import { FolderOpen } from "lucide-react";
import DocumentItem from "./DocumentItem";

export default function DocumentList({ documents, loading, onDelete }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-2xl border animate-pulse" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
            <div className="h-4 rounded w-3/4" style={{ background: "var(--hover-bg)" }} />
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="p-10 text-center rounded-2xl border border-dashed" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <FolderOpen className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
        <p style={{ color: "var(--text-secondary)" }}>No documents uploaded yet.</p>
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
