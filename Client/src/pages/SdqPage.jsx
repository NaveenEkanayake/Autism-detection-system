import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ChevronLeft, ChevronRight, Send, RefreshCw, Trophy, AlertTriangle } from "lucide-react";
import { usePatients } from "../hooks/PatientsContext";
import PageWrapper from "../components/Layout/PageWrapper";

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
  const { activePatient } = usePatients();
  const questionsRef = useRef(null);
  const resultsRef = useRef(null);
  const prevPage = useRef(sdqPage);

  const totalPages = Math.ceil(SDQ_QUESTIONS.length / QUESTIONS_PER_PAGE);
  const pageQuestions = SDQ_QUESTIONS.slice(sdqPage * QUESTIONS_PER_PAGE, (sdqPage + 1) * QUESTIONS_PER_PAGE);
  const answeredOnPage = pageQuestions.filter((q) => answers[q.id] !== undefined).length;
  const totalAnswered = Object.keys(answers).length;

  const handleAnswer = (qId, val) => setAnswers((prev) => ({ ...prev, [qId]: val }));

  useEffect(() => {
    if (!questionsRef.current) return;
    const direction = sdqPage > prevPage.current ? 1 : -1;
    prevPage.current = sdqPage;

    /*
    const ctx = gsap.context(() => {
      gsap.from(".sdq-question", {
        opacity: 0, x: direction * 40, duration: 0.4,
        stagger: 0.06, ease: "power2.out",
      });
    }, questionsRef);
    return () => ctx.revert();
    */
    return () => {};
  }, [sdqPage]);

  const handlePageChange = (dir) => {
    setSdqPage((p) => p + dir);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitSDQ = () => {
    if (totalAnswered < 25) return;
    setSaving(true);
    setTimeout(() => {
      setScores(calculateScores(answers));
      setSubmitted(true);
      setSaving(false);
    }, 800);
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
              className={`sdq-question rounded-2xl p-5 border transition-all ${
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
