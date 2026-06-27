import { useState, useRef } from "react";
import PageWrapper from "../components/Layout/PageWrapper";
import { CheckCircle, Loader2 } from "lucide-react";
import Stepper from "../components/ui/Stepper";

export default function VisionAnalysisPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const resultRef = useRef(null);

  const analysisResults = {
    detections: [
      { label: "Eye Contact", confidence: 0.87 },
      { label: "Facial Expression", confidence: 0.79 },
      { label: "Hand Gesture", confidence: 0.72 },
    ],
    behavioral_flags: ["Sustained attention detected", "Social gaze present"],
    risk_indicators: [],
    summary: "Analysis indicates typical behavioral patterns with sustained social attention. No significant risk indicators detected.",
  };

  const handleSimulateUpload = () => {
    setCurrentStep(2);
    setTimeout(() => setCurrentStep(3), 2000);
  };

  return (
    <PageWrapper title="AI Behavioral Vision Analysis">
      <Stepper currentStep={currentStep} />

      {/* Main Analysis Area */}
      <div className="rounded-2xl p-8 border space-y-6" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        {currentStep === 1 && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/15 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Upload Data</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Submit video or image data to start the AI analysis.</p>
            <button
              onClick={handleSimulateUpload}
              className="px-6 py-2.5 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
            >
              Simulate Upload
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 animate-spin text-blue-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Processing</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Analyzing through AI pipeline...</p>
          </div>
        )}

        {currentStep === 3 && (
          <div ref={resultRef} className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Analysis Complete</h2>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>AI-powered behavioral analysis results</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysisResults.detections.map((d, i) => (
                <div key={i} className="p-4 rounded-xl border" style={{ background: "var(--hover-bg)", borderColor: "var(--card-border)" }}>
                  <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>{d.label}</p>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--card-bg)" }}>
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700" style={{ width: d.confidence * 100 + "%" }} />
                  </div>
                  <span className="text-xs mt-1 block text-right font-mono" style={{ color: "var(--text-muted)" }}>
                    {(d.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl border" style={{ background: "var(--hover-bg)", borderColor: "var(--card-border)" }}>
              <p className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Behavioral Flags</p>
              <div className="flex flex-wrap gap-2">
                {analysisResults.behavioral_flags.map((f) => (
                  <span key={f} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30">
                    <CheckCircle className="w-3 h-3" /> {f}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border" style={{ background: "var(--hover-bg)", borderColor: "var(--card-border)" }}>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Summary</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{analysisResults.summary}</p>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
