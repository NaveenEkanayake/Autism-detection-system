import { Shield, Lock } from "lucide-react";

export default function SecurityNotice() {
  return (
    <div
      className="glass-card p-4 flex items-center gap-3 border border-teal-500/20"
      style={{ background: "rgba(20,184,166,0.05)" }}
    >
      <Shield className="w-5 h-5 text-teal-400 flex-shrink-0" />
      <div>
        <p className="text-teal-300 text-sm font-medium">End-to-End Encrypted Storage</p>
        <p className="text-slate-500 text-xs">
          Files are isolated by user ID. Access rules:{" "}
          <code className="text-slate-400">request.auth.uid == resource.data.userId</code>
        </p>
      </div>
      <Lock className="w-4 h-4 text-slate-600 ml-auto" />
    </div>
  );
}
