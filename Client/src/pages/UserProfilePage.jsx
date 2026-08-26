import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Mail, Edit2, Trash2, Save, X, AlertTriangle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { showToast } from "../components/ui/toast";
import { api } from "../lib/api";

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
      setLoading(false);
    }
  }, [user?.name]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      showToast({ title: "Invalid Name", description: "Name must be at least 2 characters.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const updated = await api("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      // Update local storage
      localStorage.setItem("user", JSON.stringify(updated));
      showToast({ title: "Profile Updated", description: "Your name has been updated.", type: "success" });
      setEditing(false);
      // Force page reload to reflect changes
      window.location.reload();
    } catch (err) {
      showToast({ title: "Update Failed", description: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteModalOpen(false);
    try {
      await api("/auth/profile", { method: "DELETE" });
      showToast({ title: "Account Deleted", description: "Your account has been permanently deleted.", type: "success" });
      await logout();
      navigate("/");
    } catch (err) {
      showToast({ title: "Delete Failed", description: err.message, type: "error" });
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl" style={{ background: "var(--hover-bg)" }} />
          <div className="space-y-2">
            <div className="h-6 w-32 rounded-lg" style={{ background: "var(--hover-bg)" }} />
            <div className="h-4 w-48 rounded" style={{ background: "var(--hover-bg)" }} />
          </div>
        </div>
        <div className="rounded-2xl p-6 border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl" style={{ background: "var(--hover-bg)" }} />
            <div className="space-y-2">
              <div className="h-5 w-32 rounded-lg" style={{ background: "var(--hover-bg)" }} />
              <div className="h-4 w-48 rounded" style={{ background: "var(--hover-bg)" }} />
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-xl" style={{ background: "var(--hover-bg)" }} />
            ))}
          </div>
          <div className="flex gap-3 pt-4">
            <div className="h-10 w-32 rounded-xl" style={{ background: "var(--hover-bg)" }} />
            <div className="h-10 w-32 rounded-xl" style={{ background: "var(--hover-bg)" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          className="p-2 rounded-xl transition-colors hover:bg-white/5"
          style={{ color: "var(--text-secondary)" }}
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>My Profile</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Manage your account settings</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl p-6 border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/25">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{user?.name || "User"}</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{user?.email || ""}</p>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setEditing(false); setName(user?.name || ""); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer bg-transparent"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim() || name.trim().length < 2}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
              >
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--hover-bg)" }}>
                <User className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>Name</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{user?.name || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--hover-bg)" }}>
                <Mail className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>Email</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{user?.email || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--hover-bg)" }}>
                <div className="w-4 h-4 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-teal-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>Provider</p>
                  <p className="text-sm font-medium capitalize" style={{ color: "var(--text-primary)" }}>{user?.provider || "email"}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
              >
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer bg-transparent"
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Delete Account</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Are you sure you want to delete your account? This will permanently remove all your data including child profiles, assessments, and documents. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-all cursor-pointer bg-transparent border-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
