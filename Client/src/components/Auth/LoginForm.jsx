import { useState, useMemo } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import GradientButton from "../ui/GradientButton";
import { useAuth } from "../../hooks/useAuth";
import { showToast } from "../ui/toast";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../../lib/firebase";

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
  const { login, googleLogin } = useAuth();

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

  const handleGoogleSignIn = async () => {
    setError("");
    setSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(auth, provider);
      const idToken = await credential.user.getIdToken();
      
      await googleLogin(idToken);
      
      showToast({
        title: "Welcome!",
        description: "Google login successful.",
        type: "success",
      });
      setTimeout(() => {
        onSuccess?.(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      const msg = err.message || "Google sign-in failed.";
      setError(msg);
      showToast({
        title: "Google Login Failed",
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

      <div className="relative my-4 text-center">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
        <span className="relative px-3 bg-[#171717] text-xs text-neutral-500 font-semibold uppercase tracking-wider">Or continue with</span>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.98] transition-all font-semibold text-sm text-neutral-200 cursor-pointer"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        Google
      </button>

      <p className="text-center text-sm text-neutral-500 mt-4">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onSwitchToSignup} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
          Sign up
        </button>
      </p>
    </form>
  );
}

export default LoginForm;
