import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, Baby, Calendar } from "lucide-react";
import GradientButton from "../ui/GradientButton";

function SignupForm({ onSwitchToLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [child, setChild] = useState({ name: "", dob: "", sex: "male" });

  const maxDate = new Date().toISOString().split("T")[0];
  const minDate = new Date(Date.now() - 12 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Signup data:", { ...form, child });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── Parent Account ── */}
      <div className="space-y-4 pb-4 border-b border-white/5">
        <p className="text-xs text-blue-400 font-medium flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" /> Parent / Caregiver Account
        </p>
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Child Profile ── */}
      <div className="space-y-4">
        <p className="text-xs text-teal-400 font-medium flex items-center gap-1.5">
          <Baby className="w-3.5 h-3.5" /> Child's Profile
        </p>
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">Child's Name</label>
          <div className="relative">
            <Baby className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
            <input
              type="text"
              value={child.name}
              onChange={(e) => setChild({ ...child, name: e.target.value })}
              placeholder="Alex"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">Date of Birth</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
            <input
              type="date"
              value={child.dob}
              min={minDate}
              max={maxDate}
              onChange={(e) => setChild({ ...child, dob: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all [color-scheme:dark]"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">Biological Sex</label>
          <div className="grid grid-cols-3 gap-3">
            {["male", "female", "other"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setChild({ ...child, sex: s })}
                className={"py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border capitalize " + (child.sex === s ? "border-teal-500 text-teal-300" : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-white")}
                style={child.sex === s ? { background: "rgba(20,184,166,0.12)" } : { background: "rgba(255,255,255,0.04)" }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <GradientButton type="submit" disabled={false}>
        <span className="label">Create Account &amp; Add Child</span>
      </GradientButton>

      <p className="text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}

export default SignupForm;
