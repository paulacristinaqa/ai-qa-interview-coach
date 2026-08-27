"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, StatusMessage } from "../../components/page";
import { useAuth } from "../../components/auth-provider";
import type { GrillLevel, GrillMeResponse, GrillMode, InterviewSession, JobOpportunity, JsonRecord, Question, QuestionTopic } from "../../lib/types";

export default function GrillMePage() {
  return <Suspense fallback={<section className="panel"><p>Carregando configuracao do Grill Me...</p></section>}><GrillMeContent /></Suspense>;
}

function GrillMeContent() {
  const { api } = useAuth();
  const searchParams = useSearchParams();
  const opportunityId = searchParams.get("opportunityId");
  const [topics, setTopics] = useState<QuestionTopic[]>([]);
  const [bankCount, setBankCount] = useState(0);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [sourceQuestion, setSourceQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<JsonRecord | null>(null);
  const [opportunity, setOpportunity] = useState<JobOpportunity | null>(null);
  const [message, setMessage] = useState("");
  const [config, setConfig] = useState<{ topic: string; language: "pt-BR" | "en"; level: GrillLevel; mode: GrillMode }>({ topic: "API Testing", language: "en", level: "intermediate", mode: "light-pressure" });
  const currentTurn = useMemo(() => session?.turns.find((turn) => !turn.answer), [session]);

  const loadCatalog = useCallback(async () => {
    try {
      const [topicData, bankData] = await Promise.all([
        api<QuestionTopic[]>("/questions/topics"),
        api<Question[]>("/questions")
      ]);
      setTopics(topicData); setBankCount(bankData.length);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar o catalogo."); }
  }, [api]);
  useEffect(() => { void loadCatalog(); }, [loadCatalog]);

  useEffect(() => {
    if (!opportunityId) {
      setOpportunity(null);
      return;
    }
    let ignore = false;
    api<JobOpportunity>(`/job-opportunities/${opportunityId}`)
      .then((job) => {
        if (ignore) return;
        setOpportunity(job);
        setConfig((current) => ({
          ...current,
          topic: suggestTopic(job),
          language: languageFromJob(job),
          level: levelFromJob(job)
        }));
      })
      .catch((error) => { if (!ignore) setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar a vaga."); });
    return () => { ignore = true; };
  }, [api, opportunityId]);

  async function start() {
    try {
      const response = await api<GrillMeResponse>("/grill-me/sessions", {
        method: "POST",
        body: JSON.stringify({ ...config, targetRole: opportunity?.title ?? "QA Automation Engineer", opportunityId: opportunity?.id })
      });
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
      <PageHeader
        eyebrow="Pressure practice"
        title="Grill Me"
        description={opportunity ? "Entrevista tecnica orientada aos requisitos de uma vaga especifica." : "Entrevista tecnica por tema, idioma, nivel e intensidade."}
        action={<button onClick={start}>Comecar Grill Me</button>}
      />
      <StatusMessage message={message} />
      {opportunity ? (
        <section className="panel job-training-context" aria-label="Vaga usada no treino">
          <span className="helper-text">Treino direcionado</span>
          <h2>{opportunity.title} - {opportunity.company}</h2>
          <p>{opportunity.analysis?.technicalSummary ?? "A descricao original da vaga sera usada como contexto."}</p>
          {opportunity.analysis?.gaps.length ? <div><strong>Lacunas prioritarias</strong><ul>{opportunity.analysis.gaps.slice(0, 3).map((gap) => <li key={gap}>{gap}</li>)}</ul></div> : null}
        </section>
      ) : null}
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

export function suggestTopic(job: JobOpportunity) {
  const context = [
    job.originalDescription,
    ...(job.analysis?.technologies ?? []),
    ...(job.analysis?.requiredRequirements ?? [])
  ].join(" ").toLowerCase();
  if (/\bsql\b|database|banco de dados/.test(context)) return "SQL";
  if (/playwright|cypress|selenium|automation|automacao/.test(context)) return "Automation";
  if (/\bapi\b|rest|postman|contract testing/.test(context)) return "API Testing";
  if (/agile|scrum|kanban/.test(context)) return "Agile/QA Process";
  return "Test Design";
}

export function languageFromJob(job: JobOpportunity): "pt-BR" | "en" {
  return /portugu|pt-br/i.test(job.language) ? "pt-BR" : "en";
}

export function levelFromJob(job: JobOpportunity): GrillLevel {
  if (/senior|lead|principal|staff/i.test(job.seniority)) return "advanced";
  if (/mid|pleno|intermediate/i.test(job.seniority)) return "intermediate";
  return "basic";
}
