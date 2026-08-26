import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ChevronLeft, ChevronRight, Send, RefreshCw, Trophy, AlertTriangle } from "lucide-react";
import { usePatients } from "../hooks/usePatients";
import PageWrapper from "../components/Layout/PageWrapper";
import { showToast } from "../components/ui/toast";
import { api } from "../lib/api";

const SDQ_QUESTIONS = [
  { id: 1, text: "Does your child respond when you call their name?", scale: "prosocial" },
  { id: 2, text: "Does your child make eye contact while talking or interacting?", scale: "prosocial" },
  { id: 3, text: "Does your child smile back when someone smiles at them?", scale: "prosocial" },
  { id: 4, text: "Does your child point to show you something interesting?", scale: "prosocial" },
  { id: 5, text: "Does your child use gestures, such as waving, nodding, or shaking their head?", scale: "prosocial" },
  { id: 6, text: "Does your child speak using words or short sentences appropriate for their age?", scale: "hyperactivity" },
  { id: 7, text: "Does your child repeat the same words, phrases, or sounds often?", scale: "conduct" },
  { id: 8, text: "Does your child understand simple instructions, such as “bring your shoes”?", scale: "hyperactivity" },
  { id: 9, text: "Does your child show interest in playing with other children?", scale: "peer" },
  { id: 10, text: "Does your child find it difficult to make or keep friends?", scale: "peer" },
  { id: 11, text: "Does your child prefer to play alone most of the time?", scale: "peer" },
  { id: 12, text: "Does your child engage in pretend play, such as pretending a toy car is real?", scale: "hyperactivity" },
  { id: 13, text: "Does your child understand how other people may feel, such as being sad or angry?", scale: "emotional" },
  { id: 14, text: "Does your child become upset when their normal routine changes?", scale: "emotional" },
  { id: 15, text: "Does your child repeatedly line up toys or arrange objects in a particular way?", scale: "conduct" },
  { id: 16, text: "Does your child have a very strong interest in a specific toy, topic, or activity?", scale: "conduct" },
  { id: 17, text: "Does your child make repeated body movements, such as hand flapping, rocking, spinning, or finger movements?", scale: "conduct" },
  { id: 18, text: "Is your child unusually sensitive to loud sounds?", scale: "emotional" },
  { id: 19, text: "Is your child sensitive to bright lights, certain smells, clothing materials, or food textures?", scale: "emotional" },
  { id: 20, text: "Does your child cover their ears, avoid places, or become distressed because of sensory experiences?", scale: "emotional" },
  { id: 21, text: "Does your child become very upset or have meltdowns that are difficult to calm?", scale: "hyperactivity" },
  { id: 22, text: "Does your child have difficulty expressing their needs, feelings, or discomfort?", scale: "hyperactivity" },
  { id: 23, text: "Has your child lost any language, social, or play skills they previously had?", scale: "conduct" },
  { id: 24, text: "Do these behaviours affect your child’s school life, daily activities, or relationships?", scale: "peer" },
  { id: 25, text: "Do you have concerns about your child’s communication, behaviour, social interaction, or development?", scale: "peer" },
];

const SCALE_META = {
  emotional: { label: "Emotional/Sensory", color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  conduct: { label: "Behavioral/Repetitive", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30" },
  hyperactivity: { label: "Hyperactivity/Attention", color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30" },
  peer: { label: "Social/Peer Problems", color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30" },
  prosocial: { label: "Prosocial Interaction", color: "text-teal-400", bg: "bg-teal-500/15", border: "border-teal-500/30" },
};

const SDQ_OPTIONS = ["Not True", "Somewhat True", "Certainly True"];
const QUESTIONS_PER_PAGE = 5;
const REVERSED = [1, 2, 3, 4, 5, 6, 8, 9, 12, 13];

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
  const { activePatient } = usePatients();
  const questionsRef = useRef(null);
  const resultsRef = useRef(null);
  const prevPage = useRef(0);

  const totalPages = Math.ceil(SDQ_QUESTIONS.length / QUESTIONS_PER_PAGE);
  const pageQuestions = SDQ_QUESTIONS.slice(sdqPage * QUESTIONS_PER_PAGE, (sdqPage + 1) * QUESTIONS_PER_PAGE);
  const answeredOnPage = pageQuestions.filter((q) => answers[q.id] !== undefined).length;
  const totalAnswered = Object.keys(answers).length;

  const handleAnswer = (qId, val) => setAnswers((prev) => ({ ...prev, [qId]: val }));

  // Reset state when switching children
  useEffect(() => {
    setAnswers({});
    setSdqPage(0);
    setSubmitted(false);
    setScores(null);
  }, [activePatient?.id]);

  useEffect(() => {
    if (!questionsRef.current) return;
    const direction = sdqPage > prevPage.current ? 1 : -1;
    prevPage.current = sdqPage;
    const ctx = gsap.context(() => {
      gsap.from(".sdq-question", {
        opacity: 0, x: direction * 40,
        duration: 0.4, stagger: 0.06, ease: "power2.out",
      });
    }, questionsRef);
    return () => ctx.revert();
  }, [sdqPage]);

  const handlePageChange = (dir) => {
    setSdqPage((p) => p + dir);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitSDQ = async () => {
    if (totalAnswered < 25) return;
    if (!activePatient?.id) {
      showToast({
        title: "No Child Selected",
        description: "Please select or add a child profile to submit an assessment.",
        type: "error",
      });
      return;
    }
    setSaving(true);
    try {
      const responseData = await api("/sdq/submit", {
        method: "POST",
        body: JSON.stringify({
          child_id: activePatient.id,
          responses: answers,
        }),
      });

      const calculatedScores = {
        total: responseData.result.total_difficulties_score,
        risk: responseData.result.priority === "high" ? "high" : responseData.result.band === "slightly_raised" ? "borderline" : "low",
        emotional: responseData.result.subscale_scores.emotional,
        conduct: responseData.result.subscale_scores.conduct,
        hyperactivity: responseData.result.subscale_scores.hyperactivity,
        peer: responseData.result.subscale_scores.peer,
        prosocial: responseData.result.subscale_scores.prosocial,
      };

      const sdqList = JSON.parse(localStorage.getItem(`sdq_${activePatient.id}`) || "[]");
      const newSdq = {
        id: responseData.result.id,
        patientId: activePatient.id,
        responses: answers,
        scores: calculatedScores,
        createdAt: responseData.result.submitted_at,
      };
      sdqList.unshift(newSdq);
      localStorage.setItem(`sdq_${activePatient.id}`, JSON.stringify(sdqList));

      setScores(calculatedScores);
      setSubmitted(true);
      showToast({
        title: "Assessment Submitted!",
        description: "SDQ results have been saved successfully.",
        type: "success",
      });
    } catch (err) {
      console.error("Failed to save SDQ:", err);
      showToast({
        title: "Submission Failed",
        description: err.message || "An error occurred while saving the assessment.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (submitted && resultsRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".result-header", { opacity: 0, y: -20, duration: 0.5, ease: "power3.out" });
        gsap.from(".score-card", { opacity: 0, y: 30, scale: 0.9, stagger: 0.08, duration: 0.5, ease: "back.out(1.3)", delay: 0.2 });
        gsap.from(".interpretation-card", { opacity: 0, y: 20, stagger: 0.1, duration: 0.4, ease: "power2.out", delay: 0.6 });
      }, resultsRef);
      return () => ctx.revert();
    }
  }, [submitted]);

  const resetSDQ = () => {
    gsap.to(resultsRef.current, {
      opacity: 0, y: -20, duration: 0.3, ease: "power2.in",
      onComplete: () => {
        setSubmitted(false);
        setAnswers({});
        setSdqPage(0);
        setScores(null);
      },
    });
  };

  if (saving) {
    return (
      <PageWrapper title="Submitting Assessment...">
        <div className="space-y-5 animate-pulse">
          <div className="rounded-2xl p-6 border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
            <div className="h-6 w-48 rounded-lg mb-3" style={{ background: "var(--hover-bg)" }} />
            <div className="h-4 w-32 rounded" style={{ background: "var(--hover-bg)" }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-2xl p-4 border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <div className="h-3 w-16 rounded mb-2" style={{ background: "var(--hover-bg)" }} />
                <div className="h-8 w-10 rounded mb-2" style={{ background: "var(--hover-bg)" }} />
                <div className="h-1.5 rounded-full" style={{ background: "var(--hover-bg)" }} />
              </div>
            ))}
          </div>
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Analyzing responses...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (submitted && scores) {
    return (
      <PageWrapper title="SDQ Assessment Results">
        <div ref={resultsRef} className="space-y-5">
          <div className="result-header rounded-2xl p-6 border" style={{ background: "linear-gradient(135deg, rgba(59,147,245,0.08), rgba(20,184,166,0.06))", borderColor: "var(--card-border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>SDQ Assessment Results</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Total Difficulties Score: <span className="font-bold" style={{ color: "var(--text-primary)" }}>{scores.total}/40</span></p>
              </div>
              <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${scores.risk === "high" ? "bg-red-500/15 text-red-400 border border-red-500/30" : scores.risk === "borderline" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" : "bg-teal-500/15 text-teal-400 border border-teal-500/30"}`}>
                {scores.risk === "high" ? <AlertTriangle className="w-3 h-3" /> : <Trophy className="w-3 h-3" />}
                {scores.risk === "high" ? "High Risk" : scores.risk === "borderline" ? "Borderline" : "Normal Range"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(SCALE_META).map(([key, meta]) => (
              <div key={key} className={`score-card rounded-2xl p-4 border ${meta.border}`} style={{ background: "var(--card-bg)" }}>
                <p className={`text-xs font-semibold ${meta.color} mb-2`}>{meta.label}</p>
                <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{scores[key]}</p>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--hover-bg)" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: Math.min((scores[key] / 10) * 100, 100) + "%", background: key === "prosocial" ? "#14b8a6" : "#f59e0b" }} />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-5 border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
            <p className="font-semibold text-sm mb-3" style={{ color: "var(--text-primary)" }}>Interpretation</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              {[
                { range: "0-14", label: "Normal", color: "text-teal-400" },
                { range: "15-19", label: "Borderline", color: "text-amber-400" },
                { range: "20-40", label: "Abnormal", color: "text-red-400" },
              ].map(({ range, label, color }) => (
                <div key={label} className="interpretation-card text-center p-3 rounded-xl border" style={{ background: "var(--hover-bg)", borderColor: "var(--card-border)" }}>
                  <p className={`font-bold ${color}`}>{range}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border hover:scale-[1.02] active:scale-[0.98]"
            style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--text-primary)" }}
            onClick={resetSDQ}>
            <RefreshCw className="w-4 h-4" /> New Assessment
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Strengths & Difficulties Questionnaire">
      <div className="rounded-2xl p-5 border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Strengths & Difficulties Questionnaire</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>25-item standardized behavioral assessment</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{totalAnswered}/25</span>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>answered</p>
          </div>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--hover-bg)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: (totalAnswered / 25) * 100 + "%", background: "linear-gradient(90deg, #3b93f5, #14b8a6)" }} />
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>Page {sdqPage + 1} of {totalPages}</p>
      </div>

      <div ref={questionsRef} className="space-y-4 mb-5">
        {pageQuestions.map((q) => {
          const meta = SCALE_META[q.scale];
          return (
            <div
              key={q.id}
              className={`sdq-question rounded-2xl p-5 border transition-colors duration-200 ${
                answers[q.id] !== undefined ? "border-blue-500/30" : ""
              }`}
              style={{ background: "var(--card-bg)", borderColor: answers[q.id] !== undefined ? undefined : "var(--card-border)" }}
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${meta.bg} ${meta.color}`}>
                  {q.id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm mb-2" style={{ color: "var(--text-primary)" }}>{q.text}</p>
                  <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>{meta.label}</span>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {SDQ_OPTIONS.map((opt, i) => (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(q.id, i)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-medium transition-all duration-200 border text-center ${
                          answers[q.id] === i
                            ? "border-blue-500/50 text-blue-300 bg-blue-500/15"
                            : "hover:border-white/20"
                        }`}
                        style={answers[q.id] !== i ? { background: "var(--hover-bg)", borderColor: "var(--card-border)", color: "var(--text-secondary)" } : {}}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          style={{ borderColor: "var(--card-border)", background: "var(--card-bg)", color: "var(--text-primary)" }}
          onClick={() => handlePageChange(-1)} disabled={sdqPage === 0}>
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        {sdqPage < totalPages - 1 ? (
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
            onClick={() => handlePageChange(1)}>
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
            onClick={handleSubmitSDQ} disabled={totalAnswered < 25 || saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <>Submit Assessment <Send className="w-4 h-4" /></>
            )}
          </button>
        )}
      </div>
    </PageWrapper>
  );
}

export default SdqPage;
