import { useState } from "react";
import { Baby, Calendar } from "lucide-react";
import GradientButton from "../ui/GradientButton";

// Supports letters from any language (unicode), spaces, hyphens, apostrophes
const NAME_REGEX = /^[\p{L}\s'-]+$/u;

function validateChildName(name) {
  if (!name.trim()) return "Child's name is required.";
  if (name.trim().length < 2) return "Name must be at least 2 characters.";
  if (name.trim().length > 50) return "Name is too long.";
  if (!NAME_REGEX.test(name.trim())) return "Name contains invalid characters.";
  return "";
}

function validateDob(dob) {
  if (!dob) return "Date of birth is required.";
  const birthDate = new Date(dob);
  const today = new Date();
  if (birthDate > today) return "Date of birth cannot be in the future.";
  const ageMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
  if (ageMonths < 1) return "Child must be at least 1 month old.";
  if (ageMonths > 12 * 18) return "Age seems too old for this tracker (max 18 years).";
  return "";
}

export default function AddChildForm({ onAdd, onCancel, initialData }) {
  const [form, setForm] = useState(initialData || { name: "", dob: "", sex: "male" });
  const [errors, setErrors] = useState({ name: "", dob: "" });
  const [touched, setTouched] = useState({ name: !!initialData, dob: !!initialData });
  const [saving, setSaving] = useState(false);

  const maxDate = new Date().toISOString().split("T")[0];
  const minDate = new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const err = field === "name" ? validateChildName(value) : field === "dob" ? validateDob(value) : "";
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = field === "name" ? validateChildName(form[field]) : validateDob(form[field]);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const isValid = form.name.trim().length >= 2 && form.dob && !validateChildName(form.name) && !validateDob(form.dob);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nameErr = validateChildName(form.name);
    const dobErr = validateDob(form.dob);
    setErrors({ name: nameErr, dob: dobErr });
    setTouched({ name: true, dob: true });

    if (nameErr || dobErr) return;

    setSaving(true);
    try {
      await onAdd(form);
      if (!initialData) {
        setForm({ name: "", dob: "", sex: "male" });
        setTouched({ name: false, dob: false });
        setErrors({ name: "", dob: "" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-1.5">Child's Name</label>
        <div className="relative">
          <Baby className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            placeholder="Alex"
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 transition-all ${
              errors.name && touched.name ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:border-teal-500/50 focus:ring-teal-500/30"
            }`}
            required
          />
        </div>
        {errors.name && touched.name && (
          <p className="mt-1 text-xs text-red-400">{errors.name}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-1.5">Date of Birth</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
          <input
            type="date"
            value={form.dob}
            min={minDate}
            max={maxDate}
            onChange={(e) => handleChange("dob", e.target.value)}
            onBlur={() => handleBlur("dob")}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border text-white focus:outline-none focus:ring-1 transition-all [color-scheme:dark] ${
              errors.dob && touched.dob ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:border-teal-500/50 focus:ring-teal-500/30"
            }`}
            required
          />
        </div>
        {errors.dob && touched.dob && (
          <p className="mt-1 text-xs text-red-400">{errors.dob}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">Biological Sex</label>
        <div className="grid grid-cols-3 gap-3">
          {["male", "female", "other"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setForm({ ...form, sex: s })}
              className={"py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border capitalize " + (form.sex === s ? "border-teal-500 text-teal-300" : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-white")}
              style={form.sex === s ? { background: "rgba(20,184,166,0.12)" } : { background: "rgba(255,255,255,0.04)" }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-[50px] text-sm font-semibold border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
        >
          Cancel
        </button>
        <GradientButton type="submit" loading={saving} disabled={!isValid} className="flex-1">
          <span className="label">{saving ? (initialData ? "Saving..." : "Adding...") : (initialData ? "Save Changes" : "Add Child")}</span>
        </GradientButton>
      </div>
    </form>
  );
}
