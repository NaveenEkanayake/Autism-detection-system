export default function GradientButton({ children, onClick, disabled, className = "", type = "button" }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rotating-gradient-btn relative rounded-[50px] cursor-pointer flex items-center justify-center w-full py-3 text-sm font-semibold ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}
