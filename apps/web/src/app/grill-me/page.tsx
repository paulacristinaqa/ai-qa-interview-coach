"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { PageHeader, StatusMessage } from "../../components/page";
import { useAuth } from "../../components/auth-provider";
import type { GrillLevel, GrillMeResponse, GrillMode, InterviewSession, JsonRecord, Question, QuestionTopic } from "../../lib/types";

export default function GrillMePage() {
  const { api } = useAuth();
  const [topics, setTopics] = useState<QuestionTopic[]>([]);
  const [bankCount, setBankCount] = useState(0);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [sourceQuestion, setSourceQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<JsonRecord | null>(null);
  const [message, setMessage] = useState("");
  const [config, setConfig] = useState<{ topic: string; language: "pt-BR" | "en"; level: GrillLevel; mode: GrillMode }>({ topic: "API Testing", language: "en", level: "intermediate", mode: "light-pressure" });
  const currentTurn = useMemo(() => session?.turns.find((turn) => !turn.answer), [session]);

  const loadCatalog = useCallback(async () => {
    try {
      const [topicData, bankData] = await Promise.all([api<QuestionTopic[]>("/questions/topics"), api<Question[]>("/questions")]);
      setTopics(topicData); setBankCount(bankData.length);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar o catalogo."); }
  }, [api]);
  useEffect(() => { void loadCatalog(); }, [loadCatalog]);

  async function start() {
    try {
      const response = await api<GrillMeResponse>("/grill-me/sessions", { method: "POST", body: JSON.stringify({ ...config, targetRole: "QA Automation Engineer" }) });
      setSession(response.session); setSourceQuestion(response.sourceQuestion ?? null); setAnswer(""); setResult(null);
      setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Nao foi possivel iniciar o Grill Me."); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !answer.trim()) return;
    try {
      const response = await api<GrillMeResponse>(`/grill-me/sessions/${session.id}/answers`, { method: "POST", body: JSON.stringify({ answer, helpUsed: false }) });
      setSession(response.session); setResult(response.attempt ?? null); setAnswer(""); await loadCatalog();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Nao foi possivel enviar a resposta."); }
  }

  const allTopics = ["API Testing", "SQL", "Test Design", "Automation", "Behavioral", "Agile/QA Process", ...topics.map((item) => item.topic)].filter((topic, index, list) => list.indexOf(topic) === index);
  return (
    <>
      <PageHeader eyebrow="Pressure practice" title="Grill Me" description="Entrevista tecnica por tema, idioma, nivel e intensidade." action={<button onClick={start}>Comecar Grill Me</button>} />
      <StatusMessage message={message} />
      <section className="panel">
        <div className="config-grid">
          <label>Tema<select value={config.topic} onChange={(event) => setConfig({ ...config, topic: event.target.value })}>{allTopics.map((topic) => <option key={topic}>{topic}</option>)}</select></label>
          <label>Idioma<select value={config.language} onChange={(event) => setConfig({ ...config, language: event.target.value as "pt-BR" | "en" })}><option value="en">Ingles</option><option value="pt-BR">Portugues</option></select></label>
          <label>Nivel<select value={config.level} onChange={(event) => setConfig({ ...config, level: event.target.value as GrillLevel })}><option value="basic">Basico</option><option value="intermediate">Intermediario</option><option value="advanced">Avancado</option></select></label>
          <label>Modo<select value={config.mode} onChange={(event) => setConfig({ ...config, mode: event.target.value as GrillMode })}><option value="standard">Padrao</option><option value="light-pressure">Pressao leve</option><option value="realistic">Entrevista realista</option></select></label>
        </div>
        <p className="helper-text">Banco carregado: {bankCount} perguntas.</p>
        {sourceQuestion ? <div className="mini-card"><strong>{sourceQuestion.topic} - nivel {sourceQuestion.level}</strong><p>{sourceQuestion.prompt}</p></div> : null}
        {session ? <div className="session"><div className="session-meta"><span>{session.language}</span><span>{session.topic}</span><span>{config.mode}</span><span>{session.status}</span></div><ol className="turns">{session.turns.map((turn) => <li className="conversation-turn" key={turn.orderIndex}><strong>{turn.question}</strong>{turn.answer ? <p className="answer-bubble">{turn.answer}</p> : null}{turn.coachNote ? <em>{turn.coachNote}</em> : null}</li>)}</ol>{currentTurn && session.status === "started" ? <form className="answer-form" onSubmit={submit}><label>Resposta Grill Me<textarea rows={6} value={answer} onChange={(event) => setAnswer(event.target.value)} /></label><button>Responder follow-up</button></form> : <p>Grill Me finalizado.</p>}{result ? <pre>{JSON.stringify(result, null, 2)}</pre> : null}</div> : null}
      </section>
    </>
  );
}
