import { Loader2 } from "lucide-react";

export default function GradientButton({ children, onClick, disabled, loading, className = "", type = "button" }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`rotating-gradient-btn relative rounded-[50px] cursor-pointer flex items-center justify-center w-full py-3 text-sm font-semibold ${(disabled || loading) ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </span>
    </button>
  );
}
