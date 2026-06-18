import { Download, CheckCircle, FileText } from "lucide-react";

export default function PdfReportSection({ generatingPdf, pdfDone, onGenerate }) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-white font-semibold mb-2">Comprehensive PDF Report</h3>
      <p className="text-slate-500 text-sm mb-4">
        Generates a unified clinical PDF including SDQ sub-scores, milestone progress, growth charts,
        and YOLOv8 detection screenshots -- ready for clinician review.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {["SDQ Sub-scores", "Milestone Matrix", "Growth Charts", "Vision Results"].map((item) => (
          <div key={item} className="glass-card px-3 py-2 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
            <span className="text-xs text-slate-300">{item}</span>
          </div>
        ))}
      </div>
      {pdfDone && (
        <div className="mb-4 flex items-center gap-2 text-teal-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          Report compiled and ready for download!
        </div>
      )}
      <button className="btn-primary" onClick={onGenerate} disabled={generatingPdf}>
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
