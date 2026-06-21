import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ArrowLeft, Shield, Upload, FileText, Trash2, Download, File, Image, FileVideo } from "lucide-react";

const DEMO_DOCUMENTS = [
  { id: "1", name: "SDQ_Assessment_Report.pdf", type: "application/pdf", size_bytes: 245000, uploaded_at: "2026-05-20T10:30:00Z", userId: "demo-user-1" },
  { id: "2", name: "Growth_Chart_March.png", type: "image/png", size_bytes: 1800000, uploaded_at: "2026-05-18T14:00:00Z", userId: "demo-user-1" },
];

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function getFileIcon(type) {
  if (type.includes("pdf")) return <FileText className="w-5 h-5 text-red-400" />;
  if (type.includes("image")) return <Image className="w-5 h-5 text-teal-400" />;
  if (type.includes("video")) return <FileVideo className="w-5 h-5 text-purple-400" />;
  return <File className="w-5 h-5 text-blue-400" />;
}

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
  const containerRef = useRef(null);
  const docsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".doc-section", {
        opacity: 0, y: 30, duration: 0.5,
        stagger: 0.1, ease: "power2.out", delay: 0.2,
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

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

  const handleDelete = (id) => {
    const el = document.querySelector(`[data-doc-id="${id}"]`);
    if (el) {
      gsap.to(el, {
        opacity: 0, x: -30, height: 0, padding: 0, margin: 0,
        duration: 0.3, ease: "power2.in",
        onComplete: () => setDocuments((prev) => prev.filter((d) => d.id !== id)),
      });
    } else {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handleGeneratePdf = () => {
    setGeneratingPdf(true);
    setTimeout(() => {
      setGeneratingPdf(false);
      setPdfDone(true);
    }, 2000);
  };

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="doc-section flex items-center gap-4">
        <button className="p-2 rounded-xl transition-colors hover:bg-white/5" style={{ color: "var(--text-secondary)" }} onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Document Library</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Upload, manage, and export clinical documents</p>
        </div>
      </div>

      <div className="doc-section rounded-2xl p-4 border flex items-start gap-3" style={{ background: "linear-gradient(135deg, rgba(59,147,245,0.06), rgba(20,184,166,0.04))", borderColor: "var(--card-border)" }}>
        <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>End-to-End Encrypted</p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>All documents are encrypted at rest and in transit. Only you can access them.</p>
        </div>
      </div>

      <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFiles(e.target.files)} accept=".pdf,.png,.jpg,.jpeg,.mp4" />

      <div className="doc-section">
        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${dragOver ? "border-blue-500/50 bg-blue-500/5" : ""}`}
          style={{ borderColor: dragOver ? undefined : "var(--card-border)", background: dragOver ? undefined : "var(--hover-bg)" }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          {uploading ? (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6 text-blue-400 animate-bounce" />
              </div>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>Uploading... {uploadProgress}%</p>
              <div className="w-48 h-2 rounded-full mx-auto overflow-hidden" style={{ background: "var(--hover-bg)" }}>
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto" style={{ color: "var(--text-muted)" }} />
              <p className="font-medium" style={{ color: "var(--text-secondary)" }}>Drop files here or click to upload</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Supports PDF, PNG, JPG, MP4</p>
            </div>
          )}
        </div>
      </div>

      <div ref={docsRef} className="doc-section space-y-3">
        <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Your Documents ({documents.length})</h3>
        {documents.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
            <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-secondary)" }}>No documents yet</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} data-doc-id={doc.id}
              className="flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-md"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--hover-bg)" }}>
                {getFileIcon(doc.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{doc.name}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatSize(doc.size_bytes)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl transition-colors hover:bg-white/5" style={{ color: "var(--text-muted)" }}>
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-xl transition-colors hover:bg-red-500/10 text-red-400" onClick={() => handleDelete(doc.id)}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="doc-section rounded-2xl p-5 border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Generate PDF Report</h3>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Create a comprehensive PDF report combining SDQ scores, growth charts, and milestones.</p>
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
          onClick={handleGeneratePdf}
          disabled={generatingPdf}
        >
          {generatingPdf ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : pdfDone ? (
            <>Download Report</>
          ) : (
            <>Generate Report</>
          )}
        </button>
      </div>
    </div>
  );
}

export default DocumentLibraryPage;
