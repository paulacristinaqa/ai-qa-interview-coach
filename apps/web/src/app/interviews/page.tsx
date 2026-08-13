"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PageHeader, StatusMessage } from "../../components/page";
import { useAuth } from "../../components/auth-provider";
import type { FeedbackReport, InterviewSession } from "../../lib/types";

export default function InterviewsPage() {
  const { api } = useAuth();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<FeedbackReport | null>(null);
  const [message, setMessage] = useState("");
  const [config, setConfig] = useState({ language: "en", targetRole: "QA Automation Engineer", seniority: "Senior", topic: "API Testing", difficulty: "advanced" });
  const currentTurn = useMemo(() => session?.turns.find((turn) => !turn.answer), [session]);

  useEffect(() => {
    const saved = window.sessionStorage.getItem("etqa.interviewSession");
    if (!saved) return;
    try { setSession(JSON.parse(saved) as InterviewSession); } finally { window.sessionStorage.removeItem("etqa.interviewSession"); }
  }, []);

  async function run(action: () => Promise<void>) {
    setMessage("");
    try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : "A operacao nao pode ser concluida."); }
  }

  function startInterview() {
    void run(async () => {
      setSession(await api<InterviewSession>("/interviews", { method: "POST", body: JSON.stringify(config) }));
      setFeedback(null);
      setAnswer("");
    });
  }

  function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !answer.trim()) return;
    void run(async () => {
      setSession(await api<InterviewSession>(`/interviews/${session.id}/answers`, { method: "POST", body: JSON.stringify({ answer }) }));
      setAnswer("");
    });
  }

  function completeInterview() {
    if (!session) return;
    void run(async () => {
      setSession(await api<InterviewSession>(`/interviews/${session.id}/complete`, { method: "POST" }));
      setMessage("Sessao finalizada. Gere o feedback estruturado quando quiser.");
    });
  }

  function generateFeedback() {
    if (!session) return;
    void run(async () => setFeedback(await api<FeedbackReport>(`/feedback/sessions/${session.id}`, { method: "POST" })));
  }

  return (
    <>
      <PageHeader eyebrow="Practice" title="Interviews" description="Simulacao textual configuravel com follow-ups e feedback estruturado." action={<button onClick={startInterview}>Iniciar entrevista</button>} />
      <StatusMessage message={message} />
      <section className="panel">
        <div className="config-grid">
          <label>Idioma<select value={config.language} onChange={(event) => setConfig({ ...config, language: event.target.value })}><option value="en">Ingles</option><option value="pt-BR">PT-BR</option></select></label>
          <label>Cargo<input value={config.targetRole} onChange={(event) => setConfig({ ...config, targetRole: event.target.value })} /></label>
          <label>Senioridade<input value={config.seniority} onChange={(event) => setConfig({ ...config, seniority: event.target.value })} /></label>
          <label>Tema<input value={config.topic} onChange={(event) => setConfig({ ...config, topic: event.target.value })} /></label>
        </div>
        {session ? <div className="session">
          <div className="session-meta"><span>{session.language}</span><span>{session.topic}</span><span>{session.status}</span></div>
          <ol className="turns">{session.turns.map((turn) => <li className="conversation-turn" key={turn.orderIndex}><strong>{turn.question}</strong>{turn.answer ? <p className="answer-bubble">{turn.answer}</p> : null}{turn.coachNote ? <em>{turn.coachNote}</em> : null}</li>)}</ol>
          {currentTurn && session.status === "started" ? <form className="answer-form" onSubmit={submitAnswer}><label>Sua resposta<textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={6} /></label><div className="actions"><button>Enviar resposta</button><button className="ghost-button" type="button" onClick={completeInterview}>Finalizar</button></div></form> : <button onClick={generateFeedback}>Gerar feedback estruturado</button>}
          {feedback ? <div className="feedback-panel"><div><span>Confianca: {feedback.confidenceLevel}</span><p>{feedback.overallSummary}</p></div><div className="feedback-grid">{feedback.dimensions.map((dimension) => <div className="feedback-card" key={dimension.dimension}><span>{dimension.dimension}</span><strong>{Math.round(dimension.score)}</strong><p>{dimension.recommendation}</p><small>{dimension.evidence}</small></div>)}</div></div> : null}
        </div> : <div className="inline-empty"><p>Configure a entrevista e inicie uma nova sessao.</p></div>}
      </section>
    </>
  );
}
