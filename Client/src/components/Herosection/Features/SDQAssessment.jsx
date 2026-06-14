import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { SDQ_QUESTIONS } from "./constants";

const SDQAssessment = () => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [responses, setResponses] = useState({});
  const [completed, setCompleted] = useState(false);

  const handleResponse = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const totalQuestions = SDQ_QUESTIONS.reduce((sum, cat) => sum + cat.questions.length, 0);
  const answeredQuestions = Object.keys(responses).length;
  const progressPercent = (answeredQuestions / totalQuestions) * 100;

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 }
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div className="text-center mb-8" variants={itemVariants}>
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">SDQ Assessment</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Strengths & Difficulties Questionnaire
          </h2>
          <p className="text-neutral-400">Evidence-based 25-question assessment for behavioral screening</p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white">Assessment Progress</span>
            <span className="text-sm text-neutral-400">{answeredQuestions}/{totalQuestions}</span>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Categories */}
        <div className="space-y-4">
          {SDQ_QUESTIONS.map((category) => (
            <motion.div
              key={category.id}
              className="border border-white/10 rounded-lg overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] transition-all"
              variants={itemVariants}
            >
              <button
                onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <h3 className="text-white font-semibold">{category.category}</h3>
                  <span className="text-xs text-neutral-500">({category.questions.length} questions)</span>
                </div>
                <motion.div
                  animate={{ rotate: expandedCategory === category.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-neutral-400" />
                </motion.div>
              </button>

              <AnimatePresence>
                {expandedCategory === category.id && (
                  <motion.div
                    className="border-t border-white/10 bg-black/20 px-6 py-4 space-y-6"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {category.questions.map((question) => (
                      <div key={question.id}>
                        <p className="text-sm text-neutral-300 mb-3">{question.text}</p>
                        <div className="flex gap-2">
                          {["Not True", "Somewhat True", "Certainly True"].map((label, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleResponse(question.id, idx)}
                              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                responses[question.id] === idx
                                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                                  : "bg-white/5 text-neutral-400 hover:bg-white/10 border border-white/10"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Completion Button */}
        {answeredQuestions === totalQuestions && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 w-full py-3 px-6 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
            onClick={() => setCompleted(true)}
          >
            Complete Assessment
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default SDQAssessment;