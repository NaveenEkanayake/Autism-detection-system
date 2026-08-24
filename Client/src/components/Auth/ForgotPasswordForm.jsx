import { useState, useMemo } from "react";
import { Mail, KeyRound, ArrowLeft, Shield, Lock, Eye, EyeOff } from "lucide-react";
import GradientButton from "../ui/GradientButton";
import { showToast } from "../ui/toast";
import { api } from "../../lib/api";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  if (!email.trim()) return "Email is required.";
  if (!EMAIL_REGEX.test(email.trim())) return "Please enter a valid email address.";
  return "";
}

function validateOtp(otp) {
  if (!otp) return "Verification code is required.";
  if (otp.length !== 6) return "Code must be exactly 6 digits.";
  if (!/^\d{6}$/.test(otp)) return "Code must contain only numbers.";
  return "";
}

function validatePassword(password) {
  if (!password) return "Password is required.";
  if (password.length < 6) return "Password must be at least 6 characters.";
  if (password.length > 128) return "Password is too long.";
  return "";
}

function ForgotPasswordForm({ onBackToLogin }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", otp: "", newPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({ email: "", otp: "", newPassword: "" });
  const [touched, setTouched] = useState({ email: false, otp: false, newPassword: false });
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      let err = "";
      if (field === "email") err = validateEmail(value);
      else if (field === "otp") err = validateOtp(value);
      else if (field === "newPassword") err = validatePassword(value);
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let err = "";
    if (field === "email") err = validateEmail(form.email);
    else if (field === "otp") err = validateOtp(form.otp);
    else if (field === "newPassword") err = validatePassword(form.newPassword);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  const isStep1Valid = useMemo(() => EMAIL_REGEX.test(form.email.trim()), [form.email]);
  const isStep2Valid = useMemo(() => /^\d{6}$/.test(form.otp), [form.otp]);
  const isStep3Valid = useMemo(() => form.newPassword.length >= 6, [form.newPassword]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");

    const emailErr = validateEmail(form.email);
    setFieldErrors((prev) => ({ ...prev, email: emailErr }));
    setTouched((prev) => ({ ...prev, email: true }));
    if (emailErr) return;

    setSubmitting(true);
    try {
      const data = await api("/auth/forgot/send-otp", {
        method: "POST",
        body: JSON.stringify({ email: form.email }),
      });
      // In development, the OTP is returned in the response for convenience
      if (data.devOtp) {
        console.log("DEV ONLY - Received OTP:", data.devOtp);
      }
      showToast({ title: "OTP Sent!", description: "Check your email for the verification code.", type: "success" });
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    const otpErr = validateOtp(form.otp);
    setFieldErrors((prev) => ({ ...prev, otp: otpErr }));
    setTouched((prev) => ({ ...prev, otp: true }));
    if (otpErr) return;

    setSubmitting(true);
    try {
      const data = await api("/auth/forgot/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email: form.email, otp: form.otp }),
      });
      setResetToken(data.resetToken);
      showToast({ title: "Verified!", description: "Now set your new password.", type: "success" });
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    const passErr = validatePassword(form.newPassword);
    setFieldErrors((prev) => ({ ...prev, newPassword: passErr }));
    setTouched((prev) => ({ ...prev, newPassword: true }));
    if (passErr) return;

    setSubmitting(true);
    try {
      await api("/auth/forgot/reset", {
        method: "POST",
        body: JSON.stringify({ email: form.email, reset_token: resetToken, new_password: form.newPassword }),
      });
      showToast({ title: "Password Reset!", description: "You can now log in with your new password.", type: "success" });
      setTimeout(() => onBackToLogin?.(), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>
      )}

      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div className="text-center space-y-1 pb-2">
            <Shield className="size-10 mx-auto text-blue-400 mb-2" />
            <p className="text-sm text-neutral-400">Enter your email to receive a verification code.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="you@example.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 transition-all ${
                  fieldErrors.email && touched.email ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:border-blue-500/50 focus:ring-blue-500/30"
                }`}
                required
              />
            </div>
            {fieldErrors.email && touched.email && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
            )}
          </div>
          <GradientButton type="submit" loading={submitting} disabled={!isStep1Valid}>
            <span className="label">{submitting ? "Sending..." : "Send Verification Code"}</span>
          </GradientButton>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="text-center space-y-1 pb-2">
            <KeyRound className="size-10 mx-auto text-blue-400 mb-2" />
            <p className="text-sm text-neutral-400">Enter the 6-digit code sent to your email.</p>
            <p className="text-xs text-neutral-500">{form.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Verification Code</label>
            <input
              type="text"
              value={form.otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                handleChange("otp", val);
              }}
              onBlur={() => handleBlur("otp")}
              placeholder="000000"
              maxLength={6}
              className={`w-full text-center text-2xl tracking-[0.5em] py-3 rounded-xl bg-white/5 border text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 transition-all ${
                fieldErrors.otp && touched.otp ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:border-blue-500/50 focus:ring-blue-500/30"
              }`}
              required
            />
            {fieldErrors.otp && touched.otp && (
              <p className="mt-1 text-xs text-center text-red-400">{fieldErrors.otp}</p>
            )}
          </div>
          <GradientButton type="submit" loading={submitting} disabled={!isStep2Valid}>
            <span className="label">{submitting ? "Verifying..." : "Verify Code"}</span>
          </GradientButton>

          <div className="text-center text-sm text-neutral-400 mt-4 space-y-2">
            <p>Didn't receive the code?</p>
            <button
              type="button"
              onClick={() => handleSendOtp(null)}
              className="text-blue-400 hover:underline"
              disabled={submitting}
            >
              Resend Code
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="text-center space-y-1 pb-2">
            <Lock className="size-10 mx-auto text-blue-400 mb-2" />
            <p className="text-sm text-neutral-400">Choose a new password for your account.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={form.newPassword}
                onChange={(e) => handleChange("newPassword", e.target.value)}
                onBlur={() => handleBlur("newPassword")}
                placeholder="At least 6 characters"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 transition-all ${
                  fieldErrors.newPassword && touched.newPassword ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:border-blue-500/50 focus:ring-blue-500/30"
                }`}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {fieldErrors.newPassword && touched.newPassword && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.newPassword}</p>
            )}
            {form.newPassword.length > 0 && !fieldErrors.newPassword && (
              <p className="mt-1 text-xs text-teal-400">Password looks good!</p>
            )}
          </div>
          <GradientButton type="submit" loading={submitting} disabled={!isStep3Valid}>
            <span className="label">{submitting ? "Resetting..." : "Reset Password"}</span>
          </GradientButton>
        </form>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={onBackToLogin}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to Login
        </button>
      </div>
    </div>
  );
}

export default ForgotPasswordForm;
