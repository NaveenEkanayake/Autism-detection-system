import { useState } from "react";
import { Mail, KeyRound, ArrowLeft, Shield, Lock, Eye, EyeOff } from "lucide-react";
import GradientButton from "../ui/GradientButton";
import { showToast } from "../ui/toast";

const API = "http://localhost:4001/api";

function ForgotPasswordForm({ onBackToLogin }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", otp: "", newPassword: "" });
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/forgot/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/forgot/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp: form.otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/forgot/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, resetToken, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                required
              />
            </div>
          </div>
          <GradientButton type="submit" loading={submitting}>
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
              onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              placeholder="000000"
              maxLength={6}
              className="w-full text-center text-2xl tracking-[0.5em] py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              required
            />
          </div>
          <GradientButton type="submit" loading={submitting}>
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
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
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
          </div>
          <GradientButton type="submit" loading={submitting}>
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
