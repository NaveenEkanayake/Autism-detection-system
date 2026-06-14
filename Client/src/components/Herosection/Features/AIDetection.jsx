import React, { useState } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, Activity } from "lucide-react";
import { AI_MODELS } from "./constants";

const AIDetection = () => {
  const [hoveredModel, setHoveredModel] = useState(null);

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

  return (
    <motion.div
      className="w-full py-16 px-4 md:px-8 lg:px-12"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
            <Brain className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">AI Detection Engine</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Multi-Modal AI Detection
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Advanced machine learning models trained on thousands of pediatric assessments
          </p>
        </motion.div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {AI_MODELS.map((model) => (
            <motion.div
              key={model.id}
              className="relative p-6 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"
              onMouseEnter={() => setHoveredModel(model.id)}
              onMouseLeave={() => setHoveredModel(null)}
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity pointer-events-none" />

              {/* Accuracy Badge */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">{model.name}</h3>
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-bold text-blue-400">{model.accuracy}%</span>
                </div>
              </div>

              <p className="text-sm text-neutral-400 mb-4">{model.description}</p>

              {/* Metrics */}
              <div className="space-y-2">
                {model.metrics.map((metric, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-neutral-300">{metric}</span>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-neutral-400">Accuracy</span>
                  <span className="text-xs font-mono text-white">{model.accuracy}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${model.accuracy}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    viewport={{ once: true }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detection Process Flow */}
        <motion.div className="p-8 rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/5 to-cyan-500/5" variants={itemVariants}>
          <h3 className="text-white font-semibold mb-6">Detection Process</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: 1, title: "Capture", desc: "Video & image collection" },
              { step: 2, title: "Process", desc: "AI model inference" },
              { step: 3, title: "Analyze", desc: "Pattern matching" },
              { step: 4, title: "Report", desc: "Risk assessment" }
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                  <span className="text-white font-semibold">{item.title}</span>
                </div>
                <p className="text-xs text-neutral-400 ml-11">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AIDetection;