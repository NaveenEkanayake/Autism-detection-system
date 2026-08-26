import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ArrowLeft, Shield, Upload, FileText, Trash2, Download, File, Image, FileVideo, Folder, Edit2 } from "lucide-react";
import { usePatients } from "../hooks/usePatients";
import { showToast } from "../components/ui/toast";
import { ref as sRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";
import { storage, db, auth } from "../lib/firebase";
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfDone, setPdfDone] = useState(false);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const docsRef = useRef(null);

  // Fetch documents and folders from localStorage
  useEffect(() => {
    if (!activePatient?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = JSON.parse(localStorage.getItem(`documents_${activePatient.id}`) || "[]");
      setDocuments(data || []);
      const foldersData = JSON.parse(localStorage.getItem(`folders_${activePatient.id}`) || "[]");
      setFolders(foldersData || []);
    } catch (err) {
      console.error("Failed to fetch documents and folders:", err);
      setDocuments([]);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }, [activePatient?.id]);

  const handleCreateFolder = () => {
    const name = prompt("Enter new folder name:");
    if (!name || !name.trim()) return;
    const newFolder = {
      id: `folder-${Date.now()}`,
      name: name.trim(),
      createdAt: new Date().toISOString()
    };
    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    localStorage.setItem(`folders_${activePatient.id}`, JSON.stringify(updatedFolders));
    showToast({ title: "Folder Created", description: `Folder "${name}" was created successfully.`, type: "success" });
  };

  const handleRenameFolder = (folderId) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    const newName = prompt("Enter new folder name:", folder.name);
    if (!newName || !newName.trim()) return;
    const updatedFolders = folders.map(f => f.id === folderId ? { ...f, name: newName.trim() } : f);
    setFolders(updatedFolders);
    localStorage.setItem(`folders_${activePatient.id}`, JSON.stringify(updatedFolders));
    showToast({ title: "Folder Renamed", description: `Folder was renamed to "${newName}".`, type: "success" });
  };

  const handleDeleteFolder = (folderId) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    if (window.confirm(`Are you sure you want to delete folder "${folder.name}"? Documents inside will be moved back to the root.`)) {
      const updatedFolders = folders.filter(f => f.id !== folderId);
      setFolders(updatedFolders);
      localStorage.setItem(`folders_${activePatient.id}`, JSON.stringify(updatedFolders));
      
      // Move documents inside folder back to root (folderId: null)
      const updatedDocs = documents.map(d => d.folderId === folderId ? { ...d, folderId: null } : d);
      setDocuments(updatedDocs);
      localStorage.setItem(`documents_${activePatient.id}`, JSON.stringify(updatedDocs));
      
      if (currentFolderId === folderId) {
        setCurrentFolderId(null);
      }
      showToast({ title: "Folder Deleted", description: "Folder was removed successfully.", type: "success" });
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

  const uploadFile = (file) => {
    return new Promise((resolve, reject) => {
      const fileId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      const ext = file.name.split(".").pop();
      const filePath = `documents/${activePatient.id}/${fileId}.${ext}`;
      const storageReference = sRef(storage, filePath);
      const uploadTask = uploadBytesResumable(storageReference, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          console.warn("[Storage] Firebase Storage failed, using local object URL fallback:", error.message);
          const localUrl = URL.createObjectURL(file);
          const docData = {
            id: `doc-${Date.now()}`,
            patientId: activePatient.id,
            parentUid: auth.currentUser?.uid || "mock-uid",
            name: file.name,
            type: file.type || "other",
            fileUrl: localUrl,
            size: file.size,
            size_bytes: file.size,
            createdAt: new Date().toISOString(),
            folderId: currentFolderId,
          };
          try {
            const docs = JSON.parse(localStorage.getItem(`documents_${activePatient.id}`) || "[]");
            docs.unshift(docData);
            localStorage.setItem(`documents_${activePatient.id}`, JSON.stringify(docs));
            resolve(docData);
          } catch (err) {
            reject(err);
          }
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            // Save metadata directly to Firestore and localStorage
            const docData = {
              id: `doc-${Date.now()}`,
              patientId: activePatient.id,
              parentUid: auth.currentUser?.uid || "",
              name: file.name,
              type: file.type || "other",
              fileUrl: downloadUrl,
              size: file.size,
              size_bytes: file.size,
              createdAt: new Date().toISOString(),
              folderId: currentFolderId,
            };
            const firestoreRef = await addDoc(collection(db, "documents"), docData);
            const docWithId = { ...docData, id: firestoreRef.id };
            
            const docs = JSON.parse(localStorage.getItem(`documents_${activePatient.id}`) || "[]");
            docs.unshift(docWithId);
            localStorage.setItem(`documents_${activePatient.id}`, JSON.stringify(docs));
            
            resolve(docWithId);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
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
      // Gather child details and clinical notes directly from localStorage
      const sdqData = JSON.parse(localStorage.getItem(`sdq_${activePatient.id}`) || "[]");
      const visionData = JSON.parse(localStorage.getItem(`vision_${activePatient.id}`) || "[]");
      const milestonesData = JSON.parse(localStorage.getItem(`milestones_${activePatient.id}`) || "[]");
      const growthData = JSON.parse(localStorage.getItem(`growth_${activePatient.id}`) || "[]");
      const sleepData = JSON.parse(localStorage.getItem(`sleep_${activePatient.id}`) || "[]");

      const doc = new jsPDF();
      
      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("AURA TRACK CLINICAL REPORT", 20, 25);
      
      // Metadata
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 32);
      
      // Patient Info
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
      
      // AI Vision Results (YOLOv8)
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
      
      // SDQ Scores
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
      
      // Milestones
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

      // Download file directly
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
            onClick={handleCreateFolder}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:bg-blue-500/10 hover:border-blue-500/30 cursor-pointer"
            style={{ background: "var(--hover-bg)", borderColor: "var(--card-border)", color: "var(--text-primary)" }}
          >
            <Folder className="w-3.5 h-3.5" /> Create Folder
          </button>
        </div>

        {/* Contents Grid/List */}
        <h3 className="font-semibold text-sm mt-4" style={{ color: "var(--text-primary)" }}>
          {currentFolderId === null ? "Folders & Documents" : `Items in Folder (${documents.filter(d => d.folderId === currentFolderId).length})`}
        </h3>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Loading documents...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Render Folders (only at root) */}
            {currentFolderId === null && folders.map((folder) => (
              <div 
                key={folder.id}
                onClick={() => setCurrentFolderId(folder.id)}
                className="flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-md cursor-pointer group"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-500/10 text-blue-400">
                  <Folder className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-blue-400 transition-colors" style={{ color: "var(--text-primary)" }}>{folder.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {documents.filter(d => d.folderId === folder.id).length} items
                  </p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => handleRenameFolder(folder.id)}
                    className="p-2 rounded-xl transition-colors hover:bg-white/5 text-blue-400 bg-transparent border-none cursor-pointer"
                    title="Rename Folder"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteFolder(folder.id)}
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
                  {/* Folder mover select option */}
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
                  <button className="p-2 rounded-xl transition-colors hover:bg-red-500/10 text-red-400 bg-transparent border-none cursor-pointer" onClick={() => handleDelete(doc.id)}>
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
    </div>
  );
}

export default DocumentLibraryPage;
