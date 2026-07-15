import { useState, useMemo } from "react";
import { Mail, Lock, User, Eye, EyeOff, Check, X } from "lucide-react";
import GradientButton from "../ui/GradientButton";
import { useAuth } from "../../hooks/useAuth";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
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
    case "name":
      if (!value.trim()) return "Full name is required.";
      if (value.trim().length < 2) return "Name must be at least 2 characters.";
      if (value.trim().length > 100) return "Name is too long.";
      return "";
    case "email":
      if (!value.trim()) return "Email is required.";
      if (!EMAIL_REGEX.test(value.trim())) return "Please enter a valid email address.";
      return "";
    case "password":
      if (!value) return "Password is required.";
      if (value.length < 6) return "Password must be at least 6 characters.";
      if (value.length > 128) return "Password is too long.";
      return "";
    default:
      return "";
  }
}

function PasswordStrength({ password }) {
  const strength = useMemo(() => {
    if (!password) return { label: "", score: 0, color: "" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { label: "Weak", score: 25, color: "bg-red-500" };
    if (score <= 3) return { label: "Fair", score: 50, color: "bg-orange-500" };
    if (score <= 4) return { label: "Good", score: 75, color: "bg-yellow-500" };
    return { label: "Strong", score: 100, color: "bg-teal-500" };
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
          style={{ width: `${strength.score}%` }}
        />
      </div>
      <p className={`text-xs ${strength.score >= 75 ? "text-teal-400" : strength.score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
        {strength.label}
      </p>
    </div>
  );
}

function SignupForm({ onSwitchToLogin, onSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({ name: "", email: "", password: "" });
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();

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
    return (
      form.name.trim().length >= 2 &&
      EMAIL_REGEX.test(form.email.trim()) &&
      form.password.length >= 6
    );
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate all fields on submit
    const nameErr = validateField("name", form.name);
    const emailErr = validateField("email", form.email);
    const passErr = validateField("password", form.password);
    setErrors({ name: nameErr, email: emailErr, password: passErr });
    setTouched({ name: true, email: true, password: true });

    if (nameErr || emailErr || passErr) return;

    setSubmitting(true);
    try {
      await signup(form.email, form.password, form.name);
      await signOut(auth);
      showToast({
        title: "Account Created!",
        description: "Please log in to continue.",
        type: "success",
      });
      setTimeout(() => {
        onSuccess?.(true);
      }, 1500);
    } catch (err) {
      const msg = parseAuthError(err);
      setError(msg);
      showToast({
        title: "Signup Failed",
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
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={() => handleBlur("name")}
              placeholder="John Doe"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 transition-all ${
                errors.name && touched.name ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:border-blue-500/50 focus:ring-blue-500/30"
              }`}
              required
            />
            {touched.name && !errors.name && form.name.length >= 2 && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-teal-400" />
            )}
          </div>
          {errors.name && touched.name && (
            <p className="mt-1 text-xs text-red-400">{errors.name}</p>
          )}
        </div>

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
            {touched.email && !errors.email && EMAIL_REGEX.test(form.email) && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-teal-400" />
            )}
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
              placeholder="Create a password"
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
          <PasswordStrength password={form.password} />
          <div className="mt-2 space-y-1">
            <p className="text-xs text-neutral-500 flex items-center gap-1.5">
              {form.password.length >= 6 ? <Check className="size-3 text-teal-400" /> : <X className="size-3 text-neutral-500" />}
              At least 6 characters
            </p>
          </div>
        </div>
      </div>

      <GradientButton type="submit" loading={submitting} disabled={!isValid && Object.values(errors).some(Boolean)}>
        <span className="label">{submitting ? "Creating Account..." : "Create Account"}</span>
      </GradientButton>

      <p className="text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Sign in</button>
      </p>
    </form>
  );
}

export default SignupForm;
