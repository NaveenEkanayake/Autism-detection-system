import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Share2, AlertCircle, CheckCircle } from "lucide-react";
import { SEVERITY_LEVELS } from "./constants";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function ReportGenerator() {
  const [severityLevel, setSeverityLevel] = useState(2);
  const [reportRef, setReportRef] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const generatePDF = async () => {
    const element = reportRef;
    if (!element) return;

    const canvas = await html2canvas(element, { backgroundColor: "#030509", scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`aura-track-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const currentSeverity = SEVERITY_LEVELS[severityLevel];

  return (
    <motion.div
      className="w-full py-16 px-4 md:px-8 lg:px-12"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
            <FileText className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Report Generation</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Comprehensive Autism Risk Assessment Report
          </h2>
          <p className="text-neutral-400">Generate and download detailed clinical reports</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Report Preview */}
          <motion.div
            className="lg:col-span-2 p-8 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02]"
            ref={setReportRef}
            variants={itemVariants}
          >
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Aura Track Assessment Report</h3>
                  <p className="text-xs text-neutral-400">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Patient Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Patient Name</p>
                  <p className="text-white font-medium">Sample Patient</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Age</p>
                  <p className="text-white font-medium">4 years 3 months</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Assessment Date</p>
                  <p className="text-white font-medium">{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Clinician</p>
                  <p className="text-white font-medium">Dr. John Smith</p>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="mb-8">
              <h4 className="text-white font-semibold mb-4">Risk Assessment Result</h4>
              <motion.div
                className={`p-6 rounded-lg border-2 ${currentSeverity.color}/30 border-${currentSeverity.color}/50 bg-${currentSeverity.color}/5`}
                animate={{ scale: [0.98, 1.02, 1] }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${currentSeverity.color}`}>
                    {severityLevel === 0 ? (
                      <CheckCircle className="w-8 h-8 text-white" />
                    ) : (
                      <AlertCircle className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{currentSeverity.level}</p>
                    <p className="text-neutral-400 text-sm">{currentSeverity.description}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-neutral-300">
                    Based on comprehensive multi-modal assessment including AI vision analysis, behavioral observation, and standardized questionnaires.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Key Findings */}
            <div>
              <h4 className="text-white font-semibold mb-4">Key Findings</h4>
              <div className="space-y-3">
                {[
                  "Eye contact patterns show inconsistent gaze fixation during social interaction",
                  "Speech patterns demonstrate typical prosody and language development",
                  "Motor skills assessment indicates age-appropriate coordination",
                  "Social engagement shows variable responsiveness to social cues"
                ].map((finding, idx) => (
                  <motion.div
                    key={idx}
                    className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-start gap-3"
                    variants={itemVariants}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-neutral-300">{finding}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div className="space-y-6" variants={itemVariants}>
            {/* Severity Level Selector */}
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h4 className="text-white font-semibold mb-4">Severity Level</h4>
              <div className="space-y-2">
                {SEVERITY_LEVELS.map((level, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSeverityLevel(idx)}
                    className={`w-full p-3 rounded-lg text-left transition-all border ${
                      severityLevel === idx
                        ? "border-white/30 bg-white/10 shadow-lg"
                        : "border-white/10 bg-white/5 hover:bg-white/[0.08]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${level.color}`} />
                      <span className="text-white font-medium text-sm">{level.level}</span>
                    </div>
                    <p className="text-xs text-neutral-400 ml-4">{level.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <motion.button
                onClick={generatePDF}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-4 h-4" />
                Download PDF
              </motion.button>
              <button className="w-full py-3 px-4 rounded-lg bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" />
                Share Report
              </button>
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-300">
                All reports are HIPAA-compliant and securely stored. Share only with authorized healthcare providers.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default ReportGenerator;
