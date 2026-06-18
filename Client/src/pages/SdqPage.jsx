import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Send, RefreshCw } from "lucide-react";

const SDQ_QUESTIONS = [
  { id: 1, text: "Considerate of other people's feelings", scale: "prosocial" },
  { id: 2, text: "Restless, overactive, cannot stay still for long", scale: "hyperactivity" },
  { id: 3, text: "Often complains of headaches, stomach-aches or sickness", scale: "emotional" },
  { id: 4, text: "Shares readily with other children (treats, toys, pencils etc)", scale: "prosocial" },
  { id: 5, text: "Often loses temper", scale: "conduct" },
  { id: 6, text: "Rather solitary, tends to play alone", scale: "peer" },
  { id: 7, text: "Generally well behaved, usually does what adults request", scale: "conduct" },
  { id: 8, text: "Many worries, often seems worried", scale: "emotional" },
  { id: 9, text: "Helpful if someone is hurt, upset or feeling ill", scale: "prosocial" },
  { id: 10, text: "Constantly fidgeting or squirming", scale: "hyperactivity" },
  { id: 11, text: "Has at least one good friend", scale: "peer" },
  { id: 12, text: "Often fights with other children or bullies them", scale: "conduct" },
  { id: 13, text: "Often unhappy, down-hearted or tearful", scale: "emotional" },
  { id: 14, text: "Generally liked by other children", scale: "peer" },
  { id: 15, text: "Easily distracted, concentration wanders", scale: "hyperactivity" },
  { id: 16, text: "Nervous or clingy in new situations, easily loses confidence", scale: "emotional" },
  { id: 17, text: "Kind to younger children", scale: "prosocial" },
  { id: 18, text: "Often lies or cheats", scale: "conduct" },
  { id: 19, text: "Picked on or bullied by other children", scale: "peer" },
  { id: 20, text: "Often volunteers to help others (parents, teachers, other children)", scale: "prosocial" },
  { id: 21, text: "Thinks things out before acting", scale: "hyperactivity" },
  { id: 22, text: "Steals from home, school or elsewhere", scale: "conduct" },
  { id: 23, text: "Gets along better with adults than with other children", scale: "peer" },
  { id: 24, text: "Many fears, easily scared", scale: "emotional" },
  { id: 25, text: "Sees tasks through to the end, good attention span", scale: "hyperactivity" },
];

const SCALE_META = {
  emotional: { label: "Emotional", color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  conduct: { label: "Conduct", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30" },
  hyperactivity: { label: "Hyperactivity", color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30" },
  peer: { label: "Peer Problems", color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30" },
  prosocial: { label: "Prosocial", color: "text-teal-400", bg: "bg-teal-500/15", border: "border-teal-500/30" },
};

const SDQ_OPTIONS = ["Not True", "Somewhat True", "Certainly True"];
const QUESTIONS_PER_PAGE = 5;
const REVERSED = [7, 11, 14, 21, 25];

function calculateScores(answers) {
  const scales = { emotional: 0, conduct: 0, hyperactivity: 0, peer: 0, prosocial: 0 };
  SDQ_QUESTIONS.forEach((q) => {
    const val = answers[q.id] ?? 0;
    const score = REVERSED.includes(q.id) ? 2 - val : val;
    scales[q.scale] += score;
  });
  const total = scales.emotional + scales.conduct + scales.hyperactivity + scales.peer;
  let risk = "low";
  if (total >= 20) risk = "high";
  else if (total >= 15) risk = "borderline";
  return { ...scales, total, risk };
}

function SdqPage() {
  const [sdqPage, setSdqPage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [scores, setScores] = useState(null);
  const [saving, setSaving] = useState(false);

  const totalPages = Math.ceil(SDQ_QUESTIONS.length / QUESTIONS_PER_PAGE);
  const pageQuestions = SDQ_QUESTIONS.slice(sdqPage * QUESTIONS_PER_PAGE, (sdqPage + 1) * QUESTIONS_PER_PAGE);
  const answeredOnPage = pageQuestions.filter((q) => answers[q.id] !== undefined).length;
  const totalAnswered = Object.keys(answers).length;

  const handleAnswer = (qId, val) => setAnswers((prev) => ({ ...prev, [qId]: val }));

  const handleSubmitSDQ = () => {
    if (totalAnswered < 25) return;
    setSaving(true);
    setTimeout(() => {
      setScores(calculateScores(answers));
      setSubmitted(true);
      setSaving(false);
    }, 800);
  };

  const resetSDQ = () => {
    setSubmitted(false);
    setAnswers({});
    setSdqPage(0);
    setScores(null);
  };

  if (submitted && scores) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6" style={{ background: "linear-gradient(135deg, rgba(59,147,245,0.08), rgba(20,184,166,0.06))" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-lg">SDQ Assessment Results</h3>
              <p className="text-slate-400 text-sm">Total Difficulties Score: <span className="text-white font-bold">{scores.total}/40</span></p>
            </div>
            <span className={scores.risk === "high" ? "badge-red" : scores.risk === "borderline" ? "badge-amber" : "badge-green"}>
              {scores.risk === "high" ? "High Risk" : scores.risk === "borderline" ? "Borderline" : "Normal Range"}
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(SCALE_META).map(([key, meta], i) => (
            <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className={"glass-card p-4 border " + meta.border}>
              <p className={"text-xs font-semibold " + meta.color + " mb-2"}>{meta.label}</p>
              <p className="text-white text-2xl font-display font-bold">{scores[key]}</p>
              <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: Math.min((scores[key] / 10) * 100, 100) + "%", background: key === "prosocial" ? "#14b8a6" : "#f59e0b" }} />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="glass-card p-5">
          <p className="text-white font-semibold text-sm mb-3">Interpretation</p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {[
              { range: "0-14", label: "Normal", color: "text-teal-400" },
              { range: "15-19", label: "Borderline", color: "text-amber-400" },
              { range: "20-40", label: "Abnormal", color: "text-red-400" },
            ].map(({ range, label, color }) => (
              <div key={label} className="text-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p className={"font-bold " + color}>{range}</p>
                <p className="text-slate-500 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn-secondary" onClick={resetSDQ}>
          <RefreshCw className="w-4 h-4" /> New Assessment
        </motion.button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="glass-card p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-white font-semibold">Strengths & Difficulties Questionnaire</h2>
            <p className="text-slate-500 text-sm">25-item standardized behavioral assessment</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{totalAnswered}/25</span>
            <p className="text-slate-500 text-xs">answered</p>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: (totalAnswered / 25) * 100 + "%", background: "linear-gradient(90deg, #3b93f5, #14b8a6)" }} />
        </div>
        <p className="text-slate-500 text-xs mt-2">Page {sdqPage + 1} of {totalPages}</p>
      </div>

      <div className="space-y-4 mb-5">
        {pageQuestions.map((q, idx) => {
          const meta = SCALE_META[q.scale];
          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3 }}
              className={"glass-card p-5 border " + (answers[q.id] !== undefined ? "border-blue-500/20" : "border-white/8")}
            >
              <div className="flex items-start gap-4">
                <div className={"flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold " + meta.bg + " " + meta.color}>
                  {q.id}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm mb-1">{q.text}</p>
                  <span className={"badge text-xs " + meta.bg + " " + meta.color + " " + meta.border}>{meta.label}</span>
                  <div className="flex gap-2 mt-3">
                    {SDQ_OPTIONS.map((opt, i) => (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(q.id, i)}
                        className={"flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 border " + (answers[q.id] === i ? "border-blue-500 text-blue-300" : "border-white/8 text-slate-500 hover:border-white/20 hover:text-white")}
                        style={answers[q.id] === i ? { background: "rgba(59,147,245,0.15)" } : { background: "rgba(255,255,255,0.03)" }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className="btn-secondary" onClick={() => setSdqPage((p) => p - 1)} disabled={sdqPage === 0}>
          <ChevronLeft className="w-4 h-4" /> Previous
        </motion.button>
        {sdqPage < totalPages - 1 ? (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="btn-primary" onClick={() => setSdqPage((p) => p + 1)} disabled={answeredOnPage < QUESTIONS_PER_PAGE}>
            Next <ChevronRight className="w-4 h-4" />
          </motion.button>
        ) : (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="btn-primary" onClick={handleSubmitSDQ} disabled={totalAnswered < 25 || saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <>Submit Assessment <Send className="w-4 h-4" /></>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
}

export default SdqPage;
