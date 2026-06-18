import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SecurityNotice from "../components/Documents/SecurityNotice";
import UploadZone from "../components/Documents/UploadZone";
import DocumentList from "../components/Documents/DocumentList";
import PdfReportSection from "../components/Documents/PdfReportSection";

const DEMO_DOCUMENTS = [
  { id: "1", name: "SDQ_Assessment_Report.pdf", type: "application/pdf", size_bytes: 245000, uploaded_at: "2026-05-20T10:30:00Z", userId: "demo-user-1" },
  { id: "2", name: "Growth_Chart_March.png", type: "image/png", size_bytes: 1800000, uploaded_at: "2026-05-18T14:00:00Z", userId: "demo-user-1" },
];

function DocumentLibraryPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState(DEMO_DOCUMENTS);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfDone, setPdfDone] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); };
  const handleClick = () => fileInputRef.current?.click();

  const handleFiles = (files) => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          const newDoc = {
            id: Date.now().toString(),
            name: files[0].name,
            type: files[0].type || "application/octet-stream",
            size_bytes: files[0].size,
            uploaded_at: new Date().toISOString(),
            userId: "demo-user-1",
          };
          setDocuments((prev) => [newDoc, ...prev]);
          return 0;
        }
        return p + 20;
      });
    }, 300);
  };

  const handleDelete = (id) => setDocuments((prev) => prev.filter((d) => d.id !== id));

  const handleGeneratePdf = () => {
    setGeneratingPdf(true);
    setTimeout(() => {
      setGeneratingPdf(false);
      setPdfDone(true);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <button className="btn-ghost p-2 text-slate-500 hover:text-white" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Document Library</h1>
            <p className="text-slate-500 text-sm">Upload, manage, and export clinical documents</p>
          </div>
        </div>

        <SecurityNotice />

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          accept=".pdf,.png,.jpg,.jpeg,.mp4"
        />

        <UploadZone
          uploading={uploading}
          uploadProgress={uploadProgress}
          dragOver={dragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        />

        <DocumentList documents={documents} loading={loading} onDelete={handleDelete} />

        <PdfReportSection
          generatingPdf={generatingPdf}
          pdfDone={pdfDone}
          onGenerate={handleGeneratePdf}
        />
      </div>
  );
}

export default DocumentLibraryPage;
