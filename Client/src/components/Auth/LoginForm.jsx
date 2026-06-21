import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import GradientButton from "../ui/GradientButton";
import { useAuth } from "../../hooks/useAuth";
import { showToast } from "../ui/toast";

function LoginForm({ onSwitchToSignup, onSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      console.log("🔑 Login attempt:", form.email);
      await login(form.email, form.password);
      console.log("🎉 Login complete, redirecting to dashboard");
      showToast({
        title: "Welcome Back!",
        description: "Login successful.",
        type: "success",
      });
      setTimeout(() => {
        onSuccess?.(false);
      }, 1500);
    } catch (err) {
      const msg = err.message.replace("Firebase: ", "").replace(/\(auth\/.*\)/, "").trim() || "Invalid email or password";
      setError(msg);
      console.error("❌ Login error:", msg);
      showToast({
        title: "Login Failed",
        description: msg,
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-1.5">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
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
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Enter your password"
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

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
          <input type="checkbox" className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/30" />
          Remember me
        </label>
      </div>

      <GradientButton type="submit" loading={submitting}>
        <span className="label">{submitting ? "Signing in..." : "Sign In"}</span>
      </GradientButton>

      <p className="text-center text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onSwitchToSignup} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
          Sign up
        </button>
      </p>
    </form>
  );
}

export default LoginForm;
