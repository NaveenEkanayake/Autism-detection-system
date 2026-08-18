import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Camera } from "lucide-react";
import AuraWatermark from "./AuraWatermark";
import FlowButton from "../../ui/flow-button";
import AuthModal from "../../Auth/AuthModal";
import SignupForm from "../../Auth/SignupForm";
import LoginForm from "../../Auth/LoginForm";
import ForgotPasswordForm from "../../Auth/ForgotPasswordForm";
import { useTheme } from "../../../hooks/useTheme";

function DiagnosticMockup({ mockupRef, metricLabel, cardHeading, cardDescription }) {
  const [authMode, setAuthMode] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleAuthSuccess = (isSignup = false) => {
    if (isSignup) {
      setAuthMode("login");
    } else {
      setAuthMode(null);
      navigate("/dashboard");
    }
  };
  return (
    <div className="relative w-full h-full max-w-7xl mx-auto px-4 lg:px-12 flex flex-col justify-evenly lg:grid lg:grid-cols-3 items-center lg:gap-8 z-10 py-6 lg:py-0">
      
      {/* 1. REFACTORED ANIMATED SHIMMER WATERMARK AREA */}
      <AuraWatermark />

      {/* 2. DEVICE SKEUOMORPHIC CANVAS LAYERS */}
      <div className="mockup-scroll-wrapper order-2 lg:order-2 relative w-full h-[380px] lg:h-[600px] flex items-center justify-center z-10" style={{ perspective: "1000px" }}>
        <div className="relative w-full h-full flex items-center justify-center transform scale-[0.75] md:scale-85 lg:scale-100">
          
          <div ref={mockupRef} className="relative w-[280px] h-[580px] rounded-[3rem] iphone-bezel flex flex-col will-change-transform transform-style-3d">
            <div className="absolute top-[120px] -left-[3px] w-[3px] h-[25px] hardware-btn rounded-l-md" aria-hidden="true" />
            <div className="absolute top-[160px] -left-[3px] w-[3px] h-[45px] hardware-btn rounded-l-md" aria-hidden="true" />
            <div className="absolute top-[220px] -left-[3px] w-[3px] h-[45px] hardware-btn rounded-l-md" aria-hidden="true" />

            <div className="absolute inset-[7px] rounded-[2.5rem] overflow-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.2)] z-10" style={{ backgroundColor: "var(--landing-screen)", color: "var(--landing-text)" }}>
              <div className="absolute inset-0 screen-glare z-40 pointer-events-none" aria-hidden="true" />
              
              <div className="absolute top-[5px] left-1/2 -translate-x-1/2 w-[100px] h-[28px] rounded-full z-50 flex items-center justify-center px-3" style={{ backgroundColor: "var(--landing-notch)" }}>
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.9)] animate-pulse mr-2" />
                <span className="text-[7px] font-bold uppercase tracking-widest" style={{ color: "var(--landing-text-secondary)" }}>Vision Cam</span>
              </div>

              <div className="relative w-full h-full pt-12 px-5 pb-8 flex flex-col justify-between">
                <div className="phone-widget flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase tracking-widest font-bold mb-0.5" style={{ color: "var(--landing-text-secondary)" }}>{cardHeading}</span>
                    <span className="text-base font-bold tracking-tight drop-shadow-md" style={{ color: "var(--landing-text)" }}>Development Tracking</span>
                  </div>
                  <div className="w-8 h-8 rounded-full text-blue-400 flex items-center justify-center font-bold text-xs shadow-md" style={{ backgroundColor: "var(--landing-notch)", border: "1px solid var(--landing-card-border)" }}>3-5</div>
                </div>

                <div className="phone-widget relative w-40 h-40 mx-auto flex items-center justify-center drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]">
                  <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
                    <circle cx="80" cy="80" r="64" fill="none" stroke="rgba(255,255,255,0.01)" strokeWidth="8" />
                    <circle className="progress-ring" cx="80" cy="80" r="64" fill="none" stroke="#3B82F6" strokeWidth="8" />
                  </svg>
                  <div className="text-center z-10 flex flex-col items-center">
                    <span className="counter-val text-4xl font-extrabold tracking-tighter" style={{ color: "var(--landing-text)" }}>0</span>
                    <span className="text-[7px] uppercase tracking-[0.1em] font-bold mt-1 max-w-[80px] leading-tight" style={{ color: "var(--landing-text-secondary)" }}>{metricLabel}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="phone-widget widget-depth rounded-xl p-2.5 flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mr-3 border border-blue-400/10">
                      <Camera className="size-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-semibold" style={{ color: "var(--landing-text)" }}>Image Detection</div>
                      <div className="h-1 w-20 bg-blue-500/30 rounded-full mt-1" />
                    </div>
                  </div>
                  <div className="phone-widget widget-depth rounded-xl p-2.5 flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mr-3 border border-indigo-400/10">
                      <Brain className="size-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-semibold" style={{ color: "var(--landing-text)" }}>Health Tracker</div>
                      <div className="h-1 w-14 bg-indigo-500/30 rounded-full mt-1" />
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-[3px] rounded-full" style={{ backgroundColor: "var(--landing-text-secondary)" }} />
              </div>

            </div>
          </div>

          <div className="floating-badge absolute hidden md:flex top-14 left-[-75px] floating-ui-badge rounded-xl p-3.5 items-center gap-3 z-30">
            <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-400/20">
              <Camera className="size-4 text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-tight" style={{ color: "var(--landing-text)" }}>Image Detection</p>
              <p className="text-[9px] font-medium" style={{ color: "var(--landing-text-secondary)" }}>Autism pattern recognition</p>
            </div>
          </div>

          <div className="floating-badge absolute hidden md:flex bottom-24 right-[-75px] floating-ui-badge rounded-xl p-3.5 items-center gap-3 z-30">
            <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-400/20">
              <Brain className="size-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-tight" style={{ color: "var(--landing-text)" }}>Health Monitoring</p>
              <p className="text-[9px] font-medium" style={{ color: "var(--landing-text-secondary)" }}>Growth charts & sleep logs</p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. DIAGNOSTIC SYSTEM DESCRIPTION */}
      <div className="card-left-text gsap-reveal order-3 lg:order-1 flex flex-col justify-center text-center lg:text-left z-20 w-full lg:max-w-none px-4 lg:px-0">
        <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 tracking-tight leading-tight" style={{ color: "var(--landing-text)" }}>
          {cardHeading}
        </h3>
        <p className="hidden md:block text-sm md:text-base font-light leading-relaxed mx-auto lg:mx-0 max-w-sm lg:max-w-none" style={{ color: "var(--landing-text-secondary)" }}>
          {cardDescription}
        </p>

        <div className="flex items-center gap-4 mt-6 justify-center lg:justify-start">
          <FlowButton text="Get Started" onClick={() => setAuthMode("signup")} />
          <FlowButton text="Login" onClick={() => setAuthMode("login")} />
        </div>
      </div>

      <AuthModal open={authMode === "signup"} onClose={() => setAuthMode(null)} title="Create Your Account" description="Register to start tracking your child's developmental milestones and health.">
        <SignupForm onSwitchToLogin={() => setAuthMode("login")} onSuccess={handleAuthSuccess} />
      </AuthModal>

      <AuthModal open={authMode === "login"} onClose={() => setAuthMode(null)} title="Welcome Back" description="Sign in to continue monitoring your child's progress and assessments.">
        <LoginForm onSwitchToSignup={() => setAuthMode("signup")} onSuccess={handleAuthSuccess} onSwitchToForgot={() => setAuthMode("forgot")} />
      </AuthModal>

      <AuthModal open={authMode === "forgot"} onClose={() => setAuthMode(null)} title="Reset Password" description="Verify your identity to reset your password.">
        <ForgotPasswordForm onBackToLogin={() => setAuthMode("login")} />
      </AuthModal>

    </div>
  );
}

export default DiagnosticMockup;
