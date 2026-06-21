import { Shield, Lock } from "lucide-react";

export default function SecurityNotice() {
  return (
    <div
      className="p-4 flex items-center gap-3 rounded-2xl border"
      style={{ background: "rgba(20,184,166,0.05)", borderColor: "rgba(20,184,166,0.2)" }}
    >
      <Shield className="w-5 h-5 text-teal-400 flex-shrink-0" />
      <div>
        <p className="text-teal-300 text-sm font-medium">End-to-End Encrypted Storage</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Files are isolated by user ID. Access rules:{" "}
          <code style={{ color: "var(--text-secondary)" }}>request.auth.uid == resource.data.userId</code>
        </p>
      </div>
      <Lock className="w-4 h-4 ml-auto" style={{ color: "var(--text-muted)" }} />
    </div>
  );
}
