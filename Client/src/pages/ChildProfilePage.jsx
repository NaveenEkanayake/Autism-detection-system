import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Baby, Calendar, Edit2, Trash2, Save, X, AlertTriangle } from "lucide-react";
import { usePatients } from "../hooks/usePatients";
import { showToast } from "../components/ui/toast";
import { api } from "../lib/api";

function getAge(dob) {
  if (!dob) return "";
  const birth = new Date(dob);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 1) return "< 1 month";
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
  const years = Math.floor(months / 12);
  months = months % 12;
  if (months === 0) return `${years} year${years !== 1 ? "s" : ""}`;
  return `${years}y ${months}m`;
}

export default function ChildProfilePage() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const { patients, setActivePatient, deleteChild, setEditingChild, setAddChildOpen } = usePatients();
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", dob: "", sex: "male" });
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const found = patients.find(p => p.id === childId);
    if (found) {
      setChild(found);
      setForm({ name: found.name, dob: found.dob, sex: found.sex || "male" });
    }
    setLoading(false);
  }, [childId, patients]);



  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      showToast({ title: "Invalid Name", description: "Name must be at least 2 characters.", type: "error" });
      return;
    }
    if (!form.dob) {
      showToast({ title: "Invalid DOB", description: "Date of birth is required.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      await api(`/patients/${childId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: form.name.trim(), dob: form.dob, sex: form.sex }),
      });
      // Update local state
      setActivePatient({ ...child, ...form, name: form.name.trim() });
      showToast({ title: "Profile Updated", description: `${form.name.trim()}'s profile has been updated.`, type: "success" });
      setEditing(false);
      setChild({ ...child, ...form, name: form.name.trim() });
    } catch (err) {
      showToast({ title: "Update Failed", description: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteModalOpen(false);
    try {
      await deleteChild(childId);
      showToast({ title: "Child Deleted", description: `${child.name} has been removed.`, type: "success" });
      navigate("/dashboard");
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
            <div className="h-6 w-40 rounded-lg" style={{ background: "var(--hover-bg)" }} />
            <div className="h-4 w-28 rounded" style={{ background: "var(--hover-bg)" }} />
          </div>
        </div>
        <div className="rounded-2xl p-6 border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl" style={{ background: "var(--hover-bg)" }} />
            <div className="space-y-2">
              <div className="h-5 w-32 rounded-lg" style={{ background: "var(--hover-bg)" }} />
              <div className="flex gap-2">
                <div className="h-4 w-16 rounded-full" style={{ background: "var(--hover-bg)" }} />
                <div className="h-4 w-14 rounded-full" style={{ background: "var(--hover-bg)" }} />
              </div>
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

  if (!child) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p style={{ color: "var(--text-secondary)" }}>Child not found.</p>
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
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Child Profile</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>View and manage child information</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl p-6 border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/25">
            {child.name?.[0]?.toUpperCase() || "C"}
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{child.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(59,147,245,0.15)", color: "#60a5fa" }}>
                {getAge(child.dob)}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: "rgba(20,184,166,0.15)", color: "#2dd4bf" }}>
                {child.sex || "male"}
              </span>
            </div>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Name</label>
              <div className="relative">
                <Baby className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all outline-none [color-scheme:dark]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Biological Sex</label>
              <div className="grid grid-cols-3 gap-3">
                {["male", "female", "other"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, sex: s })}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border capitalize ${
                      form.sex === s ? "border-teal-500 text-teal-300" : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-white"
                    }`}
                    style={form.sex === s ? { background: "rgba(20,184,166,0.12)" } : { background: "rgba(255,255,255,0.04)" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setEditing(false); setForm({ name: child.name, dob: child.dob, sex: child.sex || "male" }); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer bg-transparent"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
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
                <Baby className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>Name</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{child.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--hover-bg)" }}>
                <Calendar className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>Date of Birth</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{child.dob ? new Date(child.dob).toLocaleDateString() : "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--hover-bg)" }}>
                <div className="w-4 h-4 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-teal-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>Sex</p>
                  <p className="text-sm font-medium capitalize" style={{ color: "var(--text-primary)" }}>{child.sex || "male"}</p>
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
                <Trash2 className="w-4 h-4" /> Delete Profile
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
                  <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Delete Child Profile</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Are you sure you want to delete <span className="font-semibold text-white">{child.name}</span>? This will permanently remove all their data including assessments, health records, and documents.
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
