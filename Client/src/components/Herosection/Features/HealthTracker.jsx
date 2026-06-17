import React, { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Plus, TrendingUp } from "lucide-react";
import { HEALTH_TRACKER_ITEMS } from "./constants";

function HealthTracker() {
  const [selectedTracker, setSelectedTracker] = useState("milestones");
  const [logs, setLogs] = useState({});

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

  const renderTrackerContent = () => {
    switch (selectedTracker) {
      case "milestones":
        return (
          <div className="space-y-4">
            {["Social Smile", "Gaze Following", "Pointing", "First Words", "Joint Attention"].map((milestone, idx) => (
              <motion.div key={idx} className="p-4 rounded-lg bg-white/5 border border-blue-500/20 hover:bg-white/10 transition-all" variants={itemVariants}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="w-5 h-5 rounded border-blue-500" />
                    <span className="text-white font-medium">{milestone}</span>
                  </div>
                  <span className="text-xs text-neutral-500">Age: 3-12m</span>
                </div>
              </motion.div>
            ))}
          </div>
        );
      case "growth":
        return (
          <div className="space-y-6">
            {[
              { label: "Height", value: "98 cm", percentile: "50th" },
              { label: "Weight", value: "15.2 kg", percentile: "45th" },
              { label: "Head Circumference", value: "52 cm", percentile: "55th" }
            ].map((item, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <div className="flex justify-between mb-2">
                  <span className="text-white font-medium">{item.label}</span>
                  <span className="text-sm text-neutral-400">{item.value} ({item.percentile})</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-500"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${parseInt(item.percentile)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    viewport={{ once: true }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        );
      case "sleep":
        return (
          <div className="space-y-4">
            {[
              { date: "Today", hours: "8.5 hrs", quality: "Good" },
              { date: "Yesterday", hours: "7.2 hrs", quality: "Fair" },
              { date: "2 days ago", hours: "9.1 hrs", quality: "Excellent" }
            ].map((log, idx) => (
              <motion.div key={idx} className="p-4 rounded-lg bg-white/5 border border-indigo-500/20 hover:bg-white/10 transition-all flex items-center justify-between" variants={itemVariants}>
                <div>
                  <p className="text-white font-medium">{log.date}</p>
                  <p className="text-sm text-neutral-400">{log.hours}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  log.quality === "Excellent" ? "bg-green-500/20 text-green-400" :
                  log.quality === "Good" ? "bg-blue-500/20 text-blue-400" :
                  "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {log.quality}
                </span>
              </motion.div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

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
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Health Tracker</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Comprehensive Health Monitoring
          </h2>
          <p className="text-neutral-400">Track developmental progress with CDC standards</p>
        </motion.div>

        {/* Tracker Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {HEALTH_TRACKER_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                onClick={() => setSelectedTracker(item.id)}
                className={`p-6 rounded-xl border transition-all text-left ${
                  selectedTracker === item.id
                    ? "border-white/30 bg-white/10 shadow-lg shadow-white/10"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
                variants={itemVariants}
                whileHover={{ y: -4 }}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-white font-semibold">{item.title}</h3>
                <p className="text-sm text-neutral-400 mt-1">{item.description}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Content Area */}
        <motion.div className="p-8 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-xl" variants={itemVariants}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">
              {HEALTH_TRACKER_ITEMS.find(i => i.id === selectedTracker)?.title}
            </h3>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors border border-indigo-500/30">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-semibold">Add Entry</span>
            </button>
          </div>
          {renderTrackerContent()}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default HealthTracker;
