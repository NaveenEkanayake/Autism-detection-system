import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ArrowLeft, Shield, Upload, FileText, Trash2, Download, File, Image, FileVideo, Folder, Edit2 } from "lucide-react";
import { usePatients } from "../hooks/usePatients";
import { showToast } from "../components/ui/toast";
import { api } from "../lib/api";

import { jsPDF } from "jspdf";

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
  const { activePatient } = usePatients();
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Custom styled modal state (replacing prompt/confirm popup alert dialogs)
  const [modalType, setModalType] = useState(null);
  const [modalTargetId, setModalTargetId] = useState(null);
  const [modalInput, setModalInput] = useState("");
  const [modalError, setModalError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfDone, setPdfDone] = useState(false);

  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const docsRef = useRef(null);

  // Fetch documents and folders — try backend first, fallback to localStorage
  useEffect(() => {
    if (!activePatient?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const loadData = async () => {
      try {
        // Try fetching folders from backend
        const backendFolders = await api("/folders").catch(() => null);
        if (backendFolders && Array.isArray(backendFolders)) {
          setFolders(backendFolders);
          localStorage.setItem(`folders_${activePatient.id}`, JSON.stringify(backendFolders));
        } else {
          const localFolders = JSON.parse(localStorage.getItem(`folders_${activePatient.id}`) || "[]");
          setFolders(localFolders || []);
        }
      } catch (err) {
        console.error("Failed to fetch folders:", err);
        const localFolders = JSON.parse(localStorage.getItem(`folders_${activePatient.id}`) || "[]");
        setFolders(localFolders || []);
      }

      try {
        // Try fetching documents from backend
        const backendDocs = await api(`/documents/${activePatient.id}`).catch(() => null);
        if (backendDocs && backendDocs.documents) {
          // Map backend fields to frontend-expected fields
          const mappedDocs = backendDocs.documents.map(d => ({
            id: d.id,
            patientId: d.child_id,
            name: d.original_filename || d.name || "Untitled",
            type: d.category || d.type || "other",
            fileUrl: d.fileUrl || "",
            size: d.size_bytes || d.size || 0,
            size_bytes: d.size_bytes || d.size || 0,
            createdAt: d.uploaded_at || d.createdAt || new Date().toISOString(),
            folderId: d.folder_id || d.folderId || null,
          }));
          setDocuments(mappedDocs);
          localStorage.setItem(`documents_${activePatient.id}`, JSON.stringify(mappedDocs));
        } else {
          const localDocs = JSON.parse(localStorage.getItem(`documents_${activePatient.id}`) || "[]");
          setDocuments(localDocs || []);
        }
      } catch (err) {
        console.error("Failed to fetch documents:", err);
        const localDocs = JSON.parse(localStorage.getItem(`documents_${activePatient.id}`) || "[]");
        setDocuments(localDocs || []);
      }

      setLoading(false);
    };

    loadData();
  }, [activePatient?.id]);

  const triggerCreateFolder = () => {
    setModalType("create_folder");
    setModalInput("");
    setModalError("");
  };

  const handleConfirmCreateFolder = async () => {
    const name = modalInput.trim();
    if (!name) {
      setModalError("Folder name is required.");
      return;
    }

    // Client-side duplicate check first
    if (folders.some(f => f.name.toLowerCase() === name.toLowerCase())) {
      setModalError("A folder with this name already exists.");
      return;
    }

    try {
      // Try backend creation (server validates duplicates too)
      const newFolder = await api("/folders", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      const updatedFolders = [...folders, newFolder];
      setFolders(updatedFolders);
      localStorage.setItem(`folders_${activePatient.id}`, JSON.stringify(updatedFolders));
    } catch (err) {
      // Fallback to local-only creation
      const msg = err.message || "";
      if (msg.includes("already exists")) {
        setModalError(msg);
        return;
      }
      const newFolder = {
        id: `folder-${Date.now()}`,
        name: name,
        created_at: new Date().toISOString(),
      };
      const updatedFolders = [...folders, newFolder];
      setFolders(updatedFolders);
      localStorage.setItem(`folders_${activePatient.id}`, JSON.stringify(updatedFolders));
    }

    setModalType(null);
    showToast({ title: "Folder Created", description: `Folder "${name}" was created successfully.`, type: "success" });
  };

  const triggerRenameFolder = (folderId) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    setModalTargetId(folderId);
    setModalInput(folder.name);
    setModalType("rename_folder");
    setModalError("");
  };

  const handleConfirmRenameFolder = async () => {
    const name = modalInput.trim();
    if (!name) {
      setModalError("Folder name is required.");
      return;
    }
    if (folders.some(f => f.id !== modalTargetId && f.name.toLowerCase() === name.toLowerCase())) {
      setModalError("A folder with this name already exists.");
      return;
    }

    try {
      await api(`/folders/${modalTargetId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
    } catch (err) {
      // Continue with local update even if backend fails
      console.warn("Backend rename failed, updating locally:", err.message);
    }

    const updatedFolders = folders.map(f => f.id === modalTargetId ? { ...f, name: name } : f);
    setFolders(updatedFolders);
    localStorage.setItem(`folders_${activePatient.id}`, JSON.stringify(updatedFolders));
    setModalType(null);
    setModalTargetId(null);
    showToast({ title: "Folder Renamed", description: `Folder was renamed to "${name}".`, type: "success" });
  };

  const triggerDeleteFolder = (folderId) => {
    setModalTargetId(folderId);
    setModalType("delete_folder");
  };

  const handleConfirmDeleteFolder = async () => {
    const folderId = modalTargetId;
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    try {
      await api(`/folders/${folderId}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Backend delete failed, updating locally:", err.message);
    }

    const updatedFolders = folders.filter(f => f.id !== folderId);
    setFolders(updatedFolders);
    localStorage.setItem(`folders_${activePatient.id}`, JSON.stringify(updatedFolders));

    const updatedDocs = documents.map(d => d.folderId === folderId ? { ...d, folderId: null } : d);
    setDocuments(updatedDocs);
    localStorage.setItem(`documents_${activePatient.id}`, JSON.stringify(updatedDocs));

    if (currentFolderId === folderId) {
      setCurrentFolderId(null);
    }
    setModalType(null);
    setModalTargetId(null);
    showToast({ title: "Folder Deleted", description: "Folder was removed successfully.", type: "success" });
  };

  const triggerDeleteFile = (fileId) => {
    setModalTargetId(fileId);
    setModalType("delete_file");
  };

  const handleConfirmDeleteFile = async () => {
    const id = modalTargetId;
    setModalType(null);
    setModalTargetId(null);
    try {
      // Try backend delete
      await api(`/documents/${id}`, { method: "DELETE" }).catch(() => {});

      if (activePatient?.id) {
        const docs = JSON.parse(localStorage.getItem(`documents_${activePatient.id}`) || "[]");
        const filteredDocs = docs.filter((d) => d.id !== id);
        localStorage.setItem(`documents_${activePatient.id}`, JSON.stringify(filteredDocs));
      }

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
      showToast({
        title: "Document Deleted",
        type: "success",
      });
    } catch (err) {
      console.error("Delete error:", err);
      showToast({
        title: "Delete Failed",
        description: err.message,
        type: "error",
      });
    }
  };

  const handleMoveDocument = (docId, targetFolderId) => {
    const updatedDocs = documents.map(d => d.id === docId ? { ...d, folderId: targetFolderId || null } : d);
    setDocuments(updatedDocs);
    localStorage.setItem(`documents_${activePatient.id}`, JSON.stringify(updatedDocs));
    showToast({ title: "Document Moved", type: "success" });
  };



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

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("child_id", activePatient.id);
    if (currentFolderId) formData.append("folder_id", currentFolderId);
    formData.append("category", "other");

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const result = await api("/documents/upload", { method: "POST", body: formData });
      clearInterval(progressInterval);
      setUploadProgress(100);
      const docData = {
        id: result.id || `doc-${Date.now()}`,
        patientId: activePatient.id,
        name: file.name,
        type: file.type || "other",
        fileUrl: result.fileUrl || "",
        size: file.size,
        size_bytes: file.size,
        createdAt: new Date().toISOString(),
        folderId: currentFolderId,
      };
      // Also save to localStorage as fallback
      const docs = JSON.parse(localStorage.getItem(`documents_${activePatient.id}`) || "[]");
      docs.unshift(docData);
      localStorage.setItem(`documents_${activePatient.id}`, JSON.stringify(docs));
      return docData;
    } catch (err) {
      clearInterval(progressInterval);
      // Fallback: save locally if backend upload fails
      console.warn("Backend upload failed, saving locally:", err.message);
      const localUrl = URL.createObjectURL(file);
      const docData = {
        id: `doc-${Date.now()}`,
        patientId: activePatient.id,
        name: file.name,
        type: file.type || "other",
        fileUrl: localUrl,
        size: file.size,
        size_bytes: file.size,
        createdAt: new Date().toISOString(),
        folderId: currentFolderId,
      };
      const docs = JSON.parse(localStorage.getItem(`documents_${activePatient.id}`) || "[]");
      docs.unshift(docData);
      localStorage.setItem(`documents_${activePatient.id}`, JSON.stringify(docs));
      return docData;
    }
  };

  const handleFiles = async (files) => {
    if (!files.length || !activePatient?.id) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      const doc = await uploadFile(files[0]);
      setDocuments((prev) => [doc, ...prev]);
      setUploadProgress(100);
      showToast({
        title: "Upload Complete",
        description: `${doc.name} uploaded successfully`,
        type: "success",
      });
    } catch (err) {
      console.error("Upload error:", err);
      showToast({
        title: "Upload Failed",
        description: err.message,
        type: "error",
      });
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleDelete = async (id) => {
    try {
      // Try backend delete
      await api(`/documents/${id}`, { method: "DELETE" }).catch(() => {});

      if (activePatient?.id) {
        const docs = JSON.parse(localStorage.getItem(`documents_${activePatient.id}`) || "[]");
        const filteredDocs = docs.filter((d) => d.id !== id);
        localStorage.setItem(`documents_${activePatient.id}`, JSON.stringify(filteredDocs));
      }

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
      showToast({
        title: "Document Deleted",
        type: "success",
      });
    } catch (err) {
      console.error("Delete error:", err);
      showToast({
        title: "Delete Failed",
        description: err.message,
        type: "error",
      });
    }
  };

  const handleGeneratePdf = async () => {
    if (!activePatient?.id) {
      showToast({
        title: "No Child Selected",
        description: "Please select or add a child profile to generate a report.",
        type: "error",
      });
      return;
    }

    setGeneratingPdf(true);
    try {
      const sdqData = JSON.parse(localStorage.getItem(`sdq_${activePatient.id}`) || "[]");
      const visionData = JSON.parse(localStorage.getItem(`vision_${activePatient.id}`) || "[]");
      const milestonesData = JSON.parse(localStorage.getItem(`milestones_${activePatient.id}`) || "[]");
      const growthData = JSON.parse(localStorage.getItem(`growth_${activePatient.id}`) || "[]");
      const sleepData = JSON.parse(localStorage.getItem(`sleep_${activePatient.id}`) || "[]");

      const doc = new jsPDF();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("AURA TRACK CLINICAL REPORT", 20, 25);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 32);

      doc.setDrawColor(200, 200, 200);
      doc.line(20, 37, 190, 37);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Child Profile Information", 20, 45);

      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${activePatient.name}`, 20, 52);
      doc.text(`Date of Birth: ${activePatient.dob}`, 20, 59);
      doc.text(`Gender: ${activePatient.sex || "N/A"}`, 20, 66);

      let yOffset = 74;

      doc.line(20, yOffset - 3, 190, yOffset - 3);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("YOLOv8 Behavioral Vision Screening Summary", 20, yOffset);
      yOffset += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      if (visionData && visionData.length > 0) {
        const latestVision = visionData[0];
        doc.text(`Completed on: ${new Date(latestVision.createdAt).toLocaleDateString()}`, 20, yOffset);
        yOffset += 7;
        doc.text(`Vision Screening Risk Index: ${latestVision.riskScore || 0}% (${latestVision.riskLevel || "low"} risk)`, 20, yOffset);
        yOffset += 7;
        const splitSummary = doc.splitTextToSize(`AI Model Summary: ${latestVision.summary || ""}`, 170);
        doc.text(splitSummary, 20, yOffset);
        yOffset += (splitSummary.length * 5) + 3;
      } else {
        doc.setFont("helvetica", "italic");
        doc.text("No YOLOv8 behavioral vision screening assessments completed yet.", 20, yOffset);
        yOffset += 7;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.line(20, yOffset - 3, 190, yOffset - 3);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Latest SDQ Assessment Score Summary", 20, yOffset);
      yOffset += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      if (sdqData && sdqData.length > 0) {
        const latestSdq = sdqData[0];
        const sdqTotalScore = latestSdq.scores?.total !== undefined ? latestSdq.scores.total : latestSdq.scores?.totalDifficulties || 0;
        const sdqRiskLabel = latestSdq.scores?.risk || "normal";

        doc.text(`Completed on: ${new Date(latestSdq.createdAt).toLocaleDateString()}`, 20, yOffset);
        yOffset += 7;
        doc.text(`Total Difficulties Score: ${sdqTotalScore}/40 (${sdqRiskLabel} range)`, 20, yOffset);
        yOffset += 7;
        doc.text(`- Emotional: ${latestSdq.scores?.emotional || 0}   - Conduct: ${latestSdq.scores?.conduct || 0}   - Hyperactivity: ${latestSdq.scores?.hyperactivity || 0}   - Peer Problems: ${latestSdq.scores?.peer || latestSdq.scores?.peerProblems || 0}   - Prosocial: ${latestSdq.scores?.prosocial || 0}`, 20, yOffset);
        yOffset += 10;
      } else {
        doc.setFont("helvetica", "italic");
        doc.text("No Strengths & Difficulties Questionnaire (SDQ) records completed yet.", 20, yOffset);
        yOffset += 7;
      }

      doc.line(20, yOffset - 3, 190, yOffset - 3);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Developmental Milestones Logged", 20, yOffset);
      yOffset += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      if (milestonesData && milestonesData.length > 0) {
        milestonesData.slice(0, 5).forEach((m) => {
          doc.text(`• [${m.date || m.createdAt?.split("T")[0]}] ${m.title} (${m.category})`, 20, yOffset);
          yOffset += 7;
        });
      } else {
        doc.setFont("helvetica", "italic");
        doc.text("No developmental milestones logged.", 20, yOffset);
        yOffset += 7;
      }

      doc.save(`AuraTrack_ClinicalReport_${activePatient.name}.pdf`);

      setPdfDone(true);
      showToast({
        title: "Report Generated",
        description: "PDF report has been created successfully.",
        type: "success",
      });
    } catch (err) {
      console.error("PDF generation error:", err);
      showToast({
        title: "Generation Failed",
        description: err.message || "Could not generate PDF report.",
        type: "error",
      });
      setPdfDone(false);
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="doc-section flex items-center gap-4">
        <button className="p-2 rounded-xl transition-colors hover:bg-white/5" style={{ color: "var(--text-secondary)" }} onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
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

      <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFiles(e.target.files)} accept=".pdf,.png,.jpg,.jpeg,.docx" />

      <div ref={docsRef} className="doc-section space-y-4">
        {/* Folder Navigation Trail & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="flex items-center gap-2 text-sm">
            <button 
              onClick={() => setCurrentFolderId(null)}
              className={`hover:text-blue-400 transition-colors bg-transparent border-none cursor-pointer text-xs uppercase tracking-wider font-bold ${currentFolderId === null ? "text-blue-400 font-extrabold" : "text-neutral-500"}`}
            >
              Root Directory
            </button>
            {currentFolderId !== null && (
              <>
                <span className="text-neutral-600">/</span>
                <span className="text-blue-300 font-semibold text-xs uppercase tracking-wider">
                  {folders.find(f => f.id === currentFolderId)?.name || "Folder"}
                </span>
              </>
            )}
          </div>
          <button
            onClick={triggerCreateFolder}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:bg-blue-500/10 hover:border-blue-500/30 cursor-pointer"
            style={{ background: "var(--hover-bg)", borderColor: "var(--card-border)", color: "var(--text-primary)" }}
          >
            <Folder className="w-3.5 h-3.5" /> Create Folder
          </button>
        </div>

        {/* Contents Grid/List */}
        <div className="flex items-center justify-between mt-4">
          <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            {currentFolderId === null ? "Folders & Documents" : `Items in Folder (${documents.filter(d => d.folderId === currentFolderId).length})`}
          </h3>
          <div className="flex items-center gap-2">
            {uploading ? (
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                <Upload className="w-3.5 h-3.5 animate-bounce text-blue-400" />
                Uploading... {uploadProgress}%
                <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--hover-bg)" }}>
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : (
              <button
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:bg-blue-500/10 hover:border-blue-500/30 ${dragOver ? "border-blue-500/50 bg-blue-500/5" : ""}`}
                style={{ background: "var(--hover-bg)", borderColor: "var(--card-border)", color: "var(--text-primary)" }}
              >
                <Upload className="w-3.5 h-3.5" /> Upload File
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: "var(--hover-bg)" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded-lg" style={{ background: "var(--hover-bg)" }} />
                  <div className="h-3 w-1/5 rounded" style={{ background: "var(--hover-bg)" }} />
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-xl" style={{ background: "var(--hover-bg)" }} />
                  <div className="w-8 h-8 rounded-xl" style={{ background: "var(--hover-bg)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Render Folders (only at root) */}
            {currentFolderId === null && folders.map((folder) => (
              <div 
                key={folder.id}
                onDoubleClick={() => setCurrentFolderId(folder.id)}
                className="flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-md cursor-pointer group"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                title="Double-click to open folder"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-500/10 text-blue-400">
                  <Folder className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-blue-400 transition-colors" style={{ color: "var(--text-primary)" }}>{folder.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {documents.filter(d => d.folderId === folder.id).length} items &middot; Double-click to open
                  </p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => triggerRenameFolder(folder.id)}
                    className="p-2 rounded-xl transition-colors hover:bg-white/5 text-blue-400 bg-transparent border-none cursor-pointer"
                    title="Rename Folder"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => triggerDeleteFolder(folder.id)}
                    className="p-2 rounded-xl transition-colors hover:bg-red-500/10 text-red-400 bg-transparent border-none cursor-pointer"
                    title="Delete Folder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Render Documents belonging to currentFolderId */}
            {documents.filter(d => d.folderId === currentFolderId).map((doc) => (
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
                <div className="flex items-center gap-4">
                  <select
                    value={doc.folderId || ""}
                    onChange={(e) => handleMoveDocument(doc.id, e.target.value || null)}
                    className="text-xs rounded border border-neutral-700 bg-neutral-900 text-neutral-300 p-1.5 focus:outline-none cursor-pointer"
                    title="Move to Folder"
                  >
                    <option value="">Move to Root</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>

                  <a 
                    href={doc.fileUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 rounded-xl transition-colors hover:bg-white/5 text-neutral-400"
                    title="Download/View Document"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button className="p-2 rounded-xl transition-colors hover:bg-red-500/10 text-red-400 bg-transparent border-none cursor-pointer" onClick={() => triggerDeleteFile(doc.id)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Empty state for directory */}
            {folders.length === 0 && documents.filter(d => d.folderId === currentFolderId).length === 0 && currentFolderId === null && (
              <div className="text-center py-12 rounded-2xl border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                <p style={{ color: "var(--text-secondary)" }}>No files or folders yet</p>
              </div>
            )}

            {documents.filter(d => d.folderId === currentFolderId).length === 0 && currentFolderId !== null && (
              <div className="text-center py-12 rounded-2xl border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                <p style={{ color: "var(--text-secondary)" }}>This folder is empty</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom styled validation modal overlay — no browser alert() */}
      <AnimatePresence>
        {modalType && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setModalType(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {modalType === "create_folder" && "Create Folder"}
                  {modalType === "rename_folder" && "Rename Folder"}
                  {modalType === "delete_folder" && "Delete Folder"}
                  {modalType === "delete_file" && "Delete Document"}

                </h3>

                {(modalType === "create_folder" || modalType === "rename_folder") && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Folder Name"
                      value={modalInput}
                      onChange={(e) => {
                        setModalInput(e.target.value);
                        setModalError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (modalType === "create_folder") handleConfirmCreateFolder();
                          if (modalType === "rename_folder") handleConfirmRenameFolder();
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all outline-none"
                    />
                    {modalError && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-xs text-red-400 font-semibold">{modalError}</p>
                      </div>
                    )}
                  </div>
                )}

                {modalType === "delete_folder" && (
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Are you sure you want to delete this folder? Any files contained within will be moved back to the Root Directory.
                  </p>
                )}

                {modalType === "delete_file" && (
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Are you sure you want to delete this file? This action is permanent.
                  </p>
                )}



                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-all cursor-pointer bg-transparent border-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (modalType === "create_folder") handleConfirmCreateFolder();
                      if (modalType === "rename_folder") handleConfirmRenameFolder();
                      if (modalType === "delete_folder") handleConfirmDeleteFolder();
                      if (modalType === "delete_file") handleConfirmDeleteFile();

                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DocumentLibraryPage;
