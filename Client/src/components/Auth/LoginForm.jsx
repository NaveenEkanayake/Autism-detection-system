import { useState, useMemo } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import GradientButton from "../ui/GradientButton";
import { useAuth } from "../../hooks/useAuth";
import { showToast } from "../ui/toast";

const parseAuthError = (err) => {
  if (!err) return "An unknown error occurred.";
  const code = err.code || (err.message && err.message.match(/\((auth\/[^)]+)\)/)?.[1]);
  switch (code) {
    case "auth/email-already-in-use":
      return "This email address is already in use by another account.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials and try again.";
    case "auth/user-disabled":
      return "This user account has been disabled.";
    case "auth/user-not-found":
      return "No account found with this email address.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/weak-password":
      return "The password is too weak. It must be at least 6 characters long.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Access to this account has been temporarily disabled. Please try again later.";
    case "auth/network-request-failed":
      return "A network error occurred. Please check your connection and try again.";
    default:
      if (err.message) {
        let cleaned = err.message
          .replace(/^Firebase:\s*/i, "")
          .replace(/\(auth\/[^)]+\)\.?/g, "")
          .trim();
        if (cleaned.toLowerCase() === "error" || cleaned === "Error.") {
          return "Authentication failed. Please verify your details.";
        }
        return cleaned || "Authentication failed.";
      }
      return "An error occurred during authentication.";
  }
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(name, value) {
  switch (name) {
    case "email":
      if (!value.trim()) return "Email is required.";
      if (!EMAIL_REGEX.test(value.trim())) return "Please enter a valid email address.";
      return "";
    case "password":
      if (!value) return "Password is required.";
      return "";
    default:
      return "";
  }
}

function LoginForm({ onSwitchToSignup, onSuccess, onSwitchToForgot }) {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, form[field]) }));
  };

  const isValid = useMemo(() => {
    return EMAIL_REGEX.test(form.email.trim()) && form.password.length > 0;
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate all fields on submit
    const emailErr = validateField("email", form.email);
    const passErr = validateField("password", form.password);
    setErrors({ email: emailErr, password: passErr });
    setTouched({ email: true, password: true });

    if (emailErr || passErr) return;

    setSubmitting(true);
    try {
      await login(form.email, form.password);
      showToast({
        title: "Welcome Back!",
        description: "Login successful.",
        type: "success",
      });
      setTimeout(() => {
        onSuccess?.(false);
      }, 1500);
    } catch (err) {
      const msg = parseAuthError(err);
      setError(msg);
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
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            placeholder="you@example.com"
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 transition-all ${
              errors.email && touched.email ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:border-blue-500/50 focus:ring-blue-500/30"
            }`}
            required
          />
        </div>
        {errors.email && touched.email && (
          <p className="mt-1 text-xs text-red-400">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-1.5">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            onBlur={() => handleBlur("password")}
            placeholder="Enter your password"
            className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 transition-all ${
              errors.password && touched.password ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:border-blue-500/50 focus:ring-blue-500/30"
            }`}
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
        {errors.password && touched.password && (
          <p className="mt-1 text-xs text-red-400">{errors.password}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
          <input type="checkbox" className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/30" />
          Remember me
        </label>
        <button
          type="button"
          onClick={() => onSwitchToForgot?.()}
          className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          Forgot Password?
        </button>
      </div>

      <GradientButton type="submit" loading={submitting} disabled={!isValid && Object.values(errors).some(Boolean)}>
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
