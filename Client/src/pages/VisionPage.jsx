import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { CheckCircle, Info, Upload, Sparkles } from "lucide-react";
import { usePatients } from "../hooks/PatientsContext";
import Stepper from "../components/ui/Stepper";

function VisionPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [visionResult, setVisionResult] = useState(null);
  const { activePatient } = usePatients();
  const uploadRef = useRef(null);
  const resultRef = useRef(null);

  const handleVisionUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setCurrentStep(2);
    setProcessing(true);

    gsap.fromTo(uploadRef.current,
      { scale: 0.95, opacity: 0.5 },
      { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.5)" }
    );

    setTimeout(() => {
      setVisionResult({
        detections: [
          { label: "Eye Contact", confidence: 0.87 },
          { label: "Facial Expression", confidence: 0.79 },
          { label: "Hand Gesture", confidence: 0.72 },
        ],
        behavioral_flags: ["Sustained attention detected", "Social gaze present"],
        risk_indicators: [],
      });
      setCurrentStep(3);
      setProcessing(false);
    }, 2500);
  };

  useEffect(() => {
    if (visionResult && resultRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(resultRef.current, {
          opacity: 0, y: 30, duration: 0.6, ease: "power3.out",
        });
        gsap.from(".detection-item", {
          opacity: 0, x: -20, duration: 0.4,
          stagger: 0.1, ease: "power2.out", delay: 0.3,
        });
        gsap.from(".behavioral-flag", {
          opacity: 0, scale: 0.8, duration: 0.3,
          stagger: 0.08, ease: "back.out(1.5)", delay: 0.6,
        });
      });
      return () => ctx.revert();
    }
  }, [visionResult]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Stepper currentStep={currentStep} />

      <div ref={uploadRef} className="rounded-2xl p-6 border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>YOLOv8 Behavioral Vision Analysis</h3>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Upload a short video or image for AI-powered behavioral detection through a custom YOLOv8 pipeline.
        </p>
        <label className="block">
          <div className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
            uploadedFile ? "border-teal-500/40" : "hover:border-blue-500/40"
          }`} style={{ 
            background: uploadedFile ? "rgba(20,184,166,0.05)" : "var(--hover-bg)",
            borderColor: uploadedFile ? undefined : "var(--card-border)"
          }}>
            {uploadedFile ? (
              <div className="space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/15 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7 text-teal-400" />
                </div>
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>{uploadedFile.name}</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{(uploadedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "var(--hover-bg)" }}>
                  <Upload className="w-7 h-7" style={{ color: "var(--text-muted)" }} />
                </div>
                <p className="font-medium" style={{ color: "var(--text-secondary)" }}>Drop file or click to upload</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Supports MP4, MOV, JPG, PNG</p>
              </div>
            )}
          </div>
          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleVisionUpload} />
        </label>
      </div>

      {processing && (
        <div className="rounded-2xl p-6 text-center border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-blue-400" />
          </div>
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>Processing through YOLOv8 pipeline...</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Extracting facial and behavioral features</p>
        </div>
      )}

      {visionResult && !processing && (
        <div ref={resultRef} className="rounded-2xl p-6 space-y-5 border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Detection Results</h3>
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30">
              <CheckCircle className="w-3 h-3" /> Analysis Complete
            </span>
          </div>

          <div className="space-y-3">
            <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Detected Objects</p>
            {visionResult.detections.map((d, i) => (
              <div key={i} className="detection-item flex items-center gap-4 p-3 rounded-xl border" style={{ background: "var(--hover-bg)", borderColor: "var(--card-border)" }}>
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 flex-shrink-0" />
                <span className="text-sm flex-1" style={{ color: "var(--text-primary)" }}>{d.label}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: "var(--hover-bg)" }}>
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700" style={{ width: d.confidence * 100 + "%" }} />
                  </div>
                  <span className="text-xs w-10 text-right font-mono" style={{ color: "var(--text-muted)" }}>{(d.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="font-medium text-sm mb-2" style={{ color: "var(--text-primary)" }}>Behavioral Flags</p>
            <div className="flex flex-wrap gap-2">
              {visionResult.behavioral_flags.map((f) => (
                <span key={f} className="behavioral-flag flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30">
                  <CheckCircle className="w-3 h-3" /> {f}
                </span>
              ))}
              {visionResult.risk_indicators.length === 0 && (
                <span className="text-sm flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                  <Info className="w-3.5 h-3.5" /> No risk indicators detected
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisionPage;
