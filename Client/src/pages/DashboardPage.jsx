import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Brain, TrendingUp, FileText, Moon,
  ChevronRight, Camera, LayoutGrid, UserPlus, Baby, Calendar,
  X, Plus, Download, Trash2, AlertTriangle, Edit2
} from "lucide-react";
import { jsPDF } from "jspdf";
import { useAuth } from "../hooks/useAuth";
import { usePatients } from "../hooks/usePatients";
import { api } from "../lib/api";
import WelcomeHeader from "../components/Dashboard/WelcomeHeader";
import StatCard from "../components/Dashboard/StatCard";
import RecentActivity from "../components/Dashboard/RecentActivity";
import GradientButton from "../components/ui/GradientButton";
import AddChildForm from "../components/forms/AddChildForm";
import { showToast } from "../components/ui/toast";

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 animate-float-slow"
        style={{ background: "radial-gradient(circle, rgba(59,147,245,0.3), transparent 70%)" }} />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-15 animate-float-medium"
        style={{ background: "radial-gradient(circle, rgba(20,184,166,0.3), transparent 70%)" }} />
      <div className="absolute top-1/2 right-16 w-64 h-64 rounded-full opacity-10 animate-float-fast"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.25), transparent 70%)" }} />
    </div>
  );
}



function EmptyState({ onOpenModal }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-teal-500/20 flex items-center justify-center mb-6 border border-blue-500/10">
        <Baby className="w-10 h-10 text-blue-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Welcome to AuraTrack</h2>
      <p className="text-sm max-w-md mb-8" style={{ color: "var(--text-secondary)" }}>
        Get started by adding your first child profile. You will be able to track milestones, growth, sleep patterns, and run vision analyses and SDQ assessments.
      </p>
      <button
        onClick={onOpenModal}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg cursor-pointer"
        style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
      >
        <UserPlus className="w-4 h-4" />
        Add Your First Child
      </button>
    </div>
  );
}

function RiskDonutChart({ patient, latestSdq, latestVision, loading, onDownloadPdf }) {
  let percentage = 0;
  let hasData = false;
  let riskLevel = "No Data";
  let riskColor = "#6b7280"; // Neutral gray

  if (patient && !loading) {
    const hasSdq = latestSdq && (
      (latestSdq.scores && latestSdq.scores.total !== undefined && latestSdq.scores.total !== null) ||
      (latestSdq.total_difficulties_score !== undefined && latestSdq.total_difficulties_score !== null)
    );
    const hasVision = latestVision && latestVision.riskScore !== undefined && latestVision.riskScore !== null;

    if (hasSdq && hasVision) {
      const sdqVal = parseFloat(latestSdq.scores?.total !== undefined ? latestSdq.scores.total : latestSdq.total_difficulties_score) * 2.5; // Normalizes 0-40 SDQ score to 0-100 scale
      const visionVal = parseFloat(latestVision.riskScore);
      
      percentage = (sdqVal + visionVal) / 2;
      hasData = true;

      if (percentage < 40) {
        riskLevel = "SAFE";
        riskColor = "#14b8a6"; // Teal
      } else if (percentage < 70) {
        riskLevel = "MODERATE";
        riskColor = "#f59e0b"; // Orange/Amber
      } else {
        riskLevel = "AT RISK";
        riskColor = "#ef4444"; // Red/Rose
      }
    } else {
      hasData = false;
    }
  }

  // Circle geometry settings
  const radius = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = hasData ? circumference - (percentage / 100) * circumference : circumference;

  return (
    <div className="rounded-2xl p-5 border flex flex-col items-center text-center justify-between min-h-[280px] h-full" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
      <div className="w-full text-left">
        <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Autism Risk Assessment</h3>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Combined Vision and SDQ index</p>
      </div>

      <div className="relative w-36 h-36 flex items-center justify-center my-2">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="var(--hover-bg)"
            strokeWidth={strokeWidth}
          />
          {/* Foreground circle showing risk score */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke={riskColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute flex flex-col items-center justify-center">
          {!patient ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">No Child</span>
          ) : !hasData ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">No Data</span>
          ) : (
            <>
              <span className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                {percentage.toFixed(0)}%
              </span>
              <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{ color: riskColor }}>
                {riskLevel}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 w-full">
        <div className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {!patient ? (
            "Please add a child to view screening risk"
          ) : !hasData ? (
            "Complete a Vision or SDQ assessment"
          ) : (
            "Based on multi-modal evaluations"
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const { patients, activePatient, setActivePatient, deleteChild, getAgeLabel, setAddChildOpen, setEditingChild } = usePatients();
  const navigate = useNavigate();
  const ageLabel = activePatient ? getAgeLabel(activePatient.dob) : "";
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const quickRef = useRef(null);

  const [stats, setStats] = useState({
    sdq: 0,
    milestones: 0,
    growth: 0,
    documents: 0,
    sleep: 0,
    vision: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [latestSdq, setLatestSdq] = useState(null);
  const [latestVision, setLatestVision] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Inline delete confirmation modal state (replaces window.confirm)
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearTargetId, setClearTargetId] = useState(null);
  const [clearTargetName, setClearTargetName] = useState("");

  // Delete child modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState("");

  useEffect(() => {
    if (!activePatient?.id) {
      setStats({ sdq: 0, milestones: 0, growth: 0, documents: 0, sleep: 0, vision: 0 });
      setLatestSdq(null);
      setLatestVision(null);
      return;
    }
    
    const loadData = async () => {
      setStatsLoading(true);
      try {
        await Promise.all(
          (patients || []).map(async (child) => {
            try {
              const sdqHistory = await api(`/sdq/history/${child.id}`).catch(() => ({ submissions: [] }));
              const visionHistory = await api(`/vision/history/${child.id}`).catch(() => []);
              
              const sdqSubmissions = sdqHistory.submissions || [];
              localStorage.setItem(`sdq_${child.id}`, JSON.stringify(sdqSubmissions));
              localStorage.setItem(`vision_${child.id}`, JSON.stringify(visionHistory));

              if (child.id === activePatient.id) {
                setLatestSdq(sdqSubmissions[0] || null);
                setLatestVision(visionHistory[0] || null);
                
                const milestonesData = JSON.parse(localStorage.getItem(`milestones_${child.id}`) || "[]");
                const growthData = JSON.parse(localStorage.getItem(`growth_${child.id}`) || "[]");
                const documentsData = JSON.parse(localStorage.getItem(`documents_${child.id}`) || "[]");
                const sleepData = JSON.parse(localStorage.getItem(`sleep_${child.id}`) || "[]");

                setStats({
                  sdq: sdqSubmissions.length,
                  milestones: milestonesData.length,
                  growth: growthData.length,
                  documents: documentsData.length,
                  sleep: sleepData.length,
                  vision: visionHistory.length,
                });
              }
            } catch (childErr) {
              console.error(`Failed to load stats for child ${child.name}:`, childErr);
            }
          })
        );
      } catch (err) {
        console.error("Failed to load dashboard stats from backend:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    loadData();
  }, [activePatient?.id, patients, refreshTrigger]);

  const childScreenings = (patients || []).map((child) => {
    const sdqList = JSON.parse(localStorage.getItem(`sdq_${child.id}`) || "[]");
    const visionList = JSON.parse(localStorage.getItem(`vision_${child.id}`) || "[]");
    
    const childSdq = sdqList[0];
    const childVision = visionList[0];
    
    const hasSdq = childSdq && (
      (childSdq.scores && childSdq.scores.total !== undefined && childSdq.scores.total !== null) ||
      (childSdq.total_difficulties_score !== undefined && childSdq.total_difficulties_score !== null)
    );
    const hasVision = childVision && childVision.riskScore !== undefined && childVision.riskScore !== null;
    
    let sdqStatus = "Pending";
    if (hasSdq) {
      const total = childSdq.scores?.total !== undefined ? childSdq.scores.total : childSdq.total_difficulties_score;
      const level = childSdq.scores?.risk !== undefined ? childSdq.scores.risk : (childSdq.band || "Safe");
      sdqStatus = `Completed (${total}/40 - ${level.replace(/_/g, " ")})`;
    }
    
    let visionStatus = "Pending";
    if (hasVision) {
      visionStatus = `Completed (${childVision.riskScore}% - ${childVision.riskLevel})`;
    }
    
    let overallRisk = "Pending";
    if (hasSdq && hasVision) {
      const sdqVal = parseFloat(childSdq.scores?.total !== undefined ? childSdq.scores.total : childSdq.total_difficulties_score) * 2.5;
      const visionVal = parseFloat(childVision.riskScore);
      const percentage = (sdqVal + visionVal) / 2;
      if (percentage < 40) overallRisk = "Safe";
      else if (percentage < 70) overallRisk = "Moderate";
      else overallRisk = "At Risk";
    }
    
    return {
      id: child.id,
      name: child.name,
      sdqStatus,
      visionStatus,
      overallRisk,
      isActive: child.id === activePatient?.id
    };
  });

  const handleDownloadPdf = async (child) => {
    if (!child) return;
    try {
      const sdqList = JSON.parse(localStorage.getItem(`sdq_${child.id}`) || "[]");
      const visionList = JSON.parse(localStorage.getItem(`vision_${child.id}`) || "[]");
      
      const childSdq = sdqList[0];
      const childVision = visionList[0];
      
      const doc = new jsPDF();
      
      // Professional Document Header Background
      doc.setFillColor(30, 41, 59); // Slate header background
      doc.rect(0, 0, 210, 40, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("AURATRACK SCREENING SUMMARY", 20, 25);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 220, 255);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} | Clinical Tracking Support Document`, 20, 33);
      
      // Patient profile details
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Child Profile Information", 20, 52);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(20, 56, 190, 56);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Name:`, 20, 63);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(child.name, 45, 63);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Date of Birth:`, 20, 70);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(child.dob, 45, 70);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Gender:`, 20, 77);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(child.sex || "N/A", 45, 77);
      
      let yOffset = 90;
      
      // Section 1: AI Vision Analysis (YOLOv8)
      doc.setFillColor(248, 250, 252);
      doc.rect(20, yOffset, 170, 45, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("YOLOv8 Behavioral Vision Screening Summary", 25, yOffset + 8);
      
      doc.setDrawColor(241, 245, 249);
      doc.line(25, yOffset + 12, 185, yOffset + 12);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      if (childVision) {
        doc.text(`Completed: ${new Date(childVision.createdAt).toLocaleDateString()}`, 25, yOffset + 19);
        doc.text(`Screening Risk Score:`, 25, yOffset + 26);
        
        const isAtRisk = childVision.riskLevel === "At Risk" || childVision.riskLevel === "high";
        doc.setFont("helvetica", "bold");
        doc.setTextColor(isAtRisk ? 239 : 71, isAtRisk ? 68 : 85, isAtRisk ? 68 : 105);
        doc.text(`${childVision.riskScore}% (${childVision.riskLevel || "Low"} Risk)`, 65, yOffset + 26);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        const summaryText = `Model Observations: ${childVision.summary || "No behavioral markers flagged."}`;
        const splitSummary = doc.splitTextToSize(summaryText, 160);
        doc.text(splitSummary, 25, yOffset + 33);
      } else {
        doc.setFont("helvetica", "italic");
        doc.text("No YOLOv8 behavioral vision screening assessments completed yet.", 25, yOffset + 22);
      }
      
      yOffset += 55;
      
      // Section 2: SDQ Questionnaire
      doc.setFillColor(248, 250, 252);
      doc.rect(20, yOffset, 170, 52, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("Strengths & Difficulties Questionnaire (SDQ) Score Summary", 25, yOffset + 8);
      
      doc.line(25, yOffset + 12, 185, yOffset + 12);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      if (childSdq) {
        doc.text(`Completed: ${new Date(childSdq.submitted_at || childSdq.createdAt).toLocaleDateString()}`, 25, yOffset + 19);
        doc.text(`Total Difficulties Score:`, 25, yOffset + 26);
        
        const totalScore = childSdq.total_difficulties_score ?? childSdq.scores?.total ?? 0;
        const band = childSdq.band || childSdq.scores?.risk || "Safe";
        const isSdqHigh = band === "very_high" || band === "high" || totalScore >= 20;
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(isSdqHigh ? 239 : 71, isSdqHigh ? 68 : 85, isSdqHigh ? 68 : 105);
        doc.text(`${totalScore}/40 (Band: ${band.replace(/_/g, " ")})`, 68, yOffset + 26);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        
        const s = childSdq.subscale_scores || {};
        doc.text("Subscale Breakdown:", 25, yOffset + 33);
        doc.text(`• Emotional Difficulties: ${s.emotional ?? 0} / 10`, 30, yOffset + 39);
        doc.text(`• Conduct Problems: ${s.conduct ?? 0} / 10`, 30, yOffset + 45);
        doc.text(`• Hyperactivity/Inattention: ${s.hyperactivity ?? 0} / 10`, 110, yOffset + 39);
        doc.text(`• Peer Relationship Problems: ${s.peer ?? 0} / 10`, 110, yOffset + 45);
      } else {
        doc.setFont("helvetica", "italic");
        doc.text("No Strengths & Difficulties Questionnaire (SDQ) records completed yet.", 25, yOffset + 22);
      }
      
      yOffset += 62;
      
      // Clinical Disclaimer Footer
      doc.setDrawColor(226, 232, 240);
      doc.line(20, yOffset, 190, yOffset);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      const disclaimer = "Disclaimer: AuraTrack reports are compiled using automated YOLOv8 visual models and standard screening questionnaires. These indicators do not constitute a formal clinical diagnosis. Please consult a qualified pediatrician or developmental therapist to discuss these results.";
      const splitDisclaimer = doc.splitTextToSize(disclaimer, 170);
      doc.text(splitDisclaimer, 20, yOffset + 5);
      
      doc.save(`AuraTrack_Summary_Report_${child.name}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    }
  };

  const dynamicStats = [
    { label: "SDQ Assessments", value: stats.sdq, icon: Brain, color: "text-blue-400" },
    { label: "Milestones Logged", value: stats.milestones, icon: Activity, color: "text-teal-400" },
    { label: "Growth Records", value: stats.growth, icon: TrendingUp, color: "text-cyan-400" },
    { label: "Vision Screenings", value: stats.vision, icon: Camera, color: "text-purple-400" },
    { label: "Documents", value: stats.documents, icon: FileText, color: "text-amber-400" },
    { label: "Sleep Logs", value: stats.sleep, icon: Moon, color: "text-indigo-400" },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        opacity: 0, y: 30, duration: 0.8, ease: "power3.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  if (!activePatient) {
    return (
      <div ref={containerRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FloatingOrbs />
        <div ref={headerRef}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-cyan-400" />
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                  Dashboard
                </h1>
              </div>
              <p className="text-sm ml-4" style={{ color: "var(--text-secondary)" }}>
                Welcome back, {user?.name || "User"}
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto mt-12 border rounded-3xl p-6" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <EmptyState onOpenModal={() => { setEditingChild(null); setAddChildOpen(true); }} />
        </div>
      </div>
    );
  }

  const QUICK_CARDS = [
    { icon: Brain, title: "SDQ Assessment", desc: "25-item standardized behavioral screening", badge: "Clinical", color: "59,147,245", to: "/sdq" },
    { icon: Camera, title: "Vision Analysis", desc: "AI-powered behavioral detection through custom YOLOv8 model", badge: "AI Model", color: "168,85,247", to: "/vision" },
    { icon: TrendingUp, title: "Health Tracker", desc: "Milestones, growth charts, and sleep logging", badge: "Track", color: "20,184,166", to: "/health" },
    { icon: FileText, title: "Document Library", desc: "Clinical document vault with PDF export", badge: "Storage", color: "245,176,65", to: "/documents" },
  ];

  if (statsLoading && (patients || []).length > 0) {
    return (
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
        <FloatingOrbs />
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-700/50 rounded-xl" />
          <div className="h-4 w-32 bg-slate-700/30 rounded-xl ml-4" />
        </div>

        {/* WelcomeHeader skeleton */}
        <div className="h-28 w-full bg-slate-800/40 rounded-2xl border border-slate-700/30" />

        {/* Overview Section skeleton */}
        <div className="space-y-4">
          <div className="h-4 w-24 bg-slate-700/50 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 h-64 bg-slate-800/40 rounded-2xl border border-slate-700/30" />
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-28 bg-slate-800/40 rounded-2xl border border-slate-700/30" />
              ))}
            </div>
          </div>
        </div>

        {/* Activity skeleton */}
        <div className="h-64 w-full bg-slate-800/40 rounded-2xl border border-slate-700/30" />

        {/* Table skeleton */}
        <div className="p-6 rounded-2xl border border-slate-700/30 bg-slate-800/40 space-y-4">
          <div className="h-6 w-64 bg-slate-700/50 rounded-xl" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 w-full bg-slate-700/20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <FloatingOrbs />

      {/* Page Header */}
      <div ref={headerRef}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-cyan-400" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Dashboard
              </h1>
            </div>
            <p className="text-sm ml-4" style={{ color: "var(--text-secondary)" }}>
              Welcome back, {user?.name || "User"}
            </p>
          </div>
        </div>
      </div>

      <WelcomeHeader patient={activePatient} age={ageLabel} onAddChild={() => { setEditingChild(null); setAddChildOpen(true); }} />

      {/* Overview Section */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <LayoutGrid className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: "var(--text-secondary)" }}>
            Overview
          </h2>
          <div className="flex-1 h-px" style={{ background: "var(--card-border)" }} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch pb-4">
          {/* Left Column: Autism Risk Donut */}
          <div className="md:col-span-1">
            <RiskDonutChart 
              patient={activePatient} 
              latestSdq={latestSdq} 
              latestVision={latestVision} 
              loading={statsLoading} 
              onDownloadPdf={handleDownloadPdf}
            />
          </div>
          {/* Right Column: Statistics Grid */}
          <div ref={statsRef} className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {dynamicStats.map((stat) => (
              <StatCard key={stat.label} {...stat} loading={statsLoading} />
            ))}
          </div>
        </div>

      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 gap-4 md:gap-5">
        <RecentActivity stats={stats} />
      </div>

      {/* Child Screenings Overview Table */}
      <div className="rounded-2xl p-6 border space-y-4 mt-2" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>Children Screening Status Overview</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Developmental and AI behavioral evaluations summary</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wider font-semibold" style={{ borderColor: "var(--card-border)", color: "var(--text-muted)" }}>
                <th className="py-3 px-4">Child Name</th>
                <th className="py-3 px-4">Image Analysis Status</th>
                <th className="py-3 px-4">SDQ Assessment Status</th>
                <th className="py-3 px-4">Overall Score / Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm" style={{ divideColor: "var(--card-border)", borderColor: "var(--card-border)" }}>
              {childScreenings.map((row) => (
                <tr key={row.id} className={`transition-colors hover:bg-white/[0.01] ${row.isActive ? "bg-blue-500/5" : ""}`}>
                  <td className="py-3.5 px-4 font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    {row.name}
                    {row.isActive && (
                      <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Active</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      row.visionStatus === "Pending" ? "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20" : "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                    }`}>
                      {row.visionStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      row.sdqStatus === "Pending" ? "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20" : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                    }`}>
                      {row.sdqStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      row.overallRisk === "Pending" ? "bg-neutral-500/10 text-neutral-400" :
                      row.overallRisk === "Safe" ? "bg-teal-500/15 text-teal-300 border border-teal-500/20" :
                      row.overallRisk === "Moderate" ? "bg-amber-500/15 text-amber-300 border border-amber-500/20" :
                      "bg-red-500/15 text-red-300 border border-red-500/20"
                    }`}>
                      {row.overallRisk}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right flex items-center justify-end gap-3 font-medium">
                    {!row.isActive ? (
                      <button
                        onClick={() => {
                          const found = patients.find(p => p.id === row.id);
                          if (found) setActivePatient(found);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-semibold cursor-pointer bg-transparent border-none"
                      >
                        Select Profile
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-500">Selected</span>
                    )}

                    <button
                      onClick={() => handleDownloadPdf(patients.find(p => p.id === row.id))}
                      className="p-1 rounded text-teal-400 hover:bg-teal-500/10 transition-colors cursor-pointer bg-transparent border-none"
                      title="Download PDF Report"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        const child = patients.find(p => p.id === row.id);
                        if (child) {
                          setEditingChild(child);
                          setAddChildOpen(true);
                        }
                      }}
                      className="p-1 rounded text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer bg-transparent border-none"
                      title="Edit Child Profile"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setDeleteTargetId(row.id);
                        setDeleteTargetName(row.name);
                        setDeleteModalOpen(true);
                      }}
                      className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer bg-transparent border-none"
                      title="Delete Child Profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setClearTargetId(row.id);
                        setClearTargetName(row.name);
                        setClearModalOpen(true);
                      }}
                      className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer bg-transparent border-none"
                      title="Clear Assessment History"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Access */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <LayoutGrid className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: "var(--text-secondary)" }}>
            Quick Access
          </h2>
          <div className="flex-1 h-px" style={{ background: "var(--card-border)" }} />
        </div>
        <div ref={quickRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_CARDS.map((card) => (
            <button
              key={card.to}
              onClick={() => navigate(card.to)}
              className="relative overflow-hidden rounded-2xl p-6 text-left w-full group cursor-pointer border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              style={{
                background: "var(--card-bg)",
                borderColor: "var(--card-border)",
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, rgba(${card.color},0.1), rgba(${card.color},0.02))`,
                }}
              />
              <div
                className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-0 group-hover:opacity-10 transition-all duration-500"
                style={{
                  background: `radial-gradient(circle, rgba(${card.color},0.4), transparent 70%)`,
                }}
              />
              <div className="relative z-[1]">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                    style={{ background: `rgba(${card.color}, 0.12)` }}
                  >
                    <card.icon className="w-6 h-6" style={{ color: `rgb(${card.color})` }} />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full"
                    style={{ background: `rgba(${card.color}, 0.15)`, color: `rgb(${card.color})` }}>
                    {card.badge}
                  </span>
                </div>
                <h3 className="font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>{card.title}</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>{card.desc}</p>
                <span className="text-xs font-medium flex items-center gap-1 transition-all duration-300 group-hover:gap-2"
                  style={{ color: `rgb(${card.color})` }}>
                  Open <ChevronRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Delete Child Confirmation Modal (replaces window.confirm) */}
      <AnimatePresence>
        {deleteModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteModalOpen(false)}
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Delete Child Profile</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Are you sure you want to delete <span className="font-semibold text-white">{deleteTargetName}</span>? This will permanently remove all their data including assessments, health records, and documents.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-all cursor-pointer bg-transparent border-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await deleteChild(deleteTargetId);
                        showToast({ title: "Child Deleted", description: `${deleteTargetName} has been removed.`, type: "success" });
                      } catch (err) {
                        showToast({ title: "Delete Failed", description: err.message, type: "error" });
                      }
                      setDeleteModalOpen(false);
                      setDeleteTargetId(null);
                      setDeleteTargetName("");
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Inline Clear Assessment Confirmation Modal (replaces window.confirm) */}
      <AnimatePresence>
        {clearModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setClearModalOpen(false)}
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-500/15">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Clear Assessment Data</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Are you sure you want to clear all screening assessment data (SDQ and Vision) for <span className="font-semibold text-white">{clearTargetName}</span>? The child profile itself will not be deleted.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setClearModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-all cursor-pointer bg-transparent border-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setClearModalOpen(false);
                      try {
                        await api(`/sdq/clear/${clearTargetId}`, { method: "DELETE" });
                      } catch (err) {
                        console.warn("Backend SDQ clear failed or endpoint not registered:", err);
                      }
                      try {
                        await api(`/vision/clear/${clearTargetId}`, { method: "DELETE" });
                      } catch (err) {
                        console.warn("Backend Vision clear failed or endpoint not registered:", err);
                      }
                      localStorage.removeItem(`sdq_${clearTargetId}`);
                      localStorage.removeItem(`vision_${clearTargetId}`);
                      setRefreshTrigger((prev) => prev + 1);
                      setClearTargetId(null);
                      setClearTargetName("");
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                  >
                    Clear Data
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

export default DashboardPage;
