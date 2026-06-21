import { Download, CheckCircle, FileText } from "lucide-react";

export default function PdfReportSection({ generatingPdf, pdfDone, onGenerate }) {
  return (
    <div className="p-6 rounded-2xl border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
      <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Comprehensive PDF Report</h3>
      <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
        Generates a unified clinical PDF including SDQ sub-scores, milestone progress, growth charts,
        and YOLOv8 detection screenshots -- ready for clinician review.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {["SDQ Sub-scores", "Milestone Matrix", "Growth Charts", "Vision Results"].map((item) => (
          <div key={item} className="px-3 py-2 flex items-center gap-2 rounded-xl" style={{ background: "var(--hover-bg)" }}>
            <CheckCircle className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{item}</span>
          </div>
        ))}
      </div>
      {pdfDone && (
        <div className="mb-4 flex items-center gap-2 text-sm text-teal-400">
          <CheckCircle className="w-4 h-4" />
          Report compiled and ready for download!
        </div>
      )}
      <button
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
        onClick={onGenerate}
        disabled={generatingPdf}
      >
        {generatingPdf ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Compiling Report...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" /> Generate PDF Report
          </>
        )}
      </button>
    </div>
  );
}
