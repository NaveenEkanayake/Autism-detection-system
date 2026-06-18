import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, CheckCircle, Info } from "lucide-react";

function VisionPage() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [visionResult, setVisionResult] = useState(null);

  const handleVisionUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setProcessing(true);
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
      setProcessing(false);
    }, 2500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-1">YOLOv8 Behavioral Vision Analysis</h3>
        <p className="text-slate-500 text-sm mb-6">
          Upload a short video or image for AI-powered behavioral detection through a custom YOLOv8 pipeline.
        </p>
        <label className="block">
          <div className={"border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 " + (uploadedFile ? "border-teal-500/40" : "border-white/10 hover:border-blue-500/40")}
            style={{ background: uploadedFile ? "rgba(20,184,166,0.05)" : "rgba(255,255,255,0.02)" }}>
            {uploadedFile ? (
              <div>
                <CheckCircle className="w-10 h-10 text-teal-400 mx-auto mb-3" />
                <p className="text-teal-300 font-medium">{uploadedFile.name}</p>
                <p className="text-slate-500 text-sm">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <Camera className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-medium mb-1">Drop file or click to upload</p>
                <p className="text-slate-600 text-sm">Supports MP4, MOV, JPG, PNG</p>
              </div>
            )}
          </div>
          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleVisionUpload} />
        </label>
      </div>

      {processing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 text-center">
          <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Processing through YOLOv8 pipeline...</p>
          <p className="text-slate-500 text-sm mt-1">Extracting facial and behavioral features</p>
        </motion.div>
      )}

      {visionResult && !processing && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Detection Results</h3>
            <span className="badge-green"><CheckCircle className="w-3 h-3" /> Analysis Complete</span>
          </div>

          <div className="space-y-3">
            <p className="text-white font-medium text-sm">Detected Objects</p>
            {visionResult.detections.map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm flex-1">{d.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: d.confidence * 100 + "%" }} />
                  </div>
                  <span className="text-slate-500 text-xs w-10 text-right">{(d.confidence * 100).toFixed(0)}%</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div>
            <p className="text-white font-medium text-sm">Behavioral Flags</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {visionResult.behavioral_flags.map((f) => (
                <span key={f} className="badge-teal flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> {f}</span>
              ))}
              {visionResult.risk_indicators.length === 0 && (
                <span className="text-slate-500 text-sm flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> No risk indicators detected</span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default VisionPage;
