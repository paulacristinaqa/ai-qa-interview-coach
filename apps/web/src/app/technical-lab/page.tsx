"use client";

import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, StatusMessage } from "../../components/page";
import { useAuth } from "../../components/auth-provider";
import type { HelpLevel, JsonRecord, LearningEvent, Question, QuestionTopic, TechnicalChallenge } from "../../lib/types";

export default function TechnicalLabPage() {
  return <Suspense fallback={<section className="panel"><p>Carregando exercício recomendado...</p></section>}><TechnicalLabContent /></Suspense>;
}

function TechnicalLabContent() {
  const { api } = useAuth();
  const searchParams = useSearchParams();
  const requestedChallengeId = searchParams.get("challengeId");
  const [challenges, setChallenges] = useState<TechnicalChallenge[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [labAnswer, setLabAnswer] = useState("");
  const [labResult, setLabResult] = useState<JsonRecord | null>(null);
  const [topics, setTopics] = useState<QuestionTopic[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [questionResult, setQuestionResult] = useState<JsonRecord | null>(null);
  const [hint, setHint] = useState<LearningEvent | null>(null);
  const [questionConfig, setQuestionConfig] = useState({ topic: "API Testing", language: "en" as "pt-BR" | "en", level: 2 });
  const [message, setMessage] = useState("");
  const selectedChallenge = challenges.find((challenge) => challenge.id === selectedId);

  const loadCatalog = useCallback(async () => {
    try {
      const [challengeData, topicData] = await Promise.all([api<TechnicalChallenge[]>("/technical-lab/challenges"), api<QuestionTopic[]>("/questions/topics")]);
      setChallenges(challengeData); setTopics(topicData); setSelectedId((current) => selectChallengeId(challengeData, current, requestedChallengeId));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar o laboratorio."); }
  }, [api, requestedChallengeId]);
  useEffect(() => { void loadCatalog(); }, [loadCatalog]);

  async function loadQuestion() {
    const params = new URLSearchParams({ topic: questionConfig.topic, language: questionConfig.language, level: String(questionConfig.level) });
    try { setQuestion(await api<Question>(`/questions/next?${params}`)); setQuestionResult(null); setHint(null); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Nao foi possivel buscar a pergunta."); }
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question || !questionAnswer.trim()) return;
    try {
      setQuestionResult(await api<JsonRecord>(`/questions/${question.id}/attempts`, { method: "POST", body: JSON.stringify({ answer: questionAnswer, helpUsed: Boolean(hint) }) }));
      setQuestionAnswer("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Nao foi possivel avaliar a resposta."); }
  }

  async function askHint(helpLevel: HelpLevel) {
    try { setHint(await api<LearningEvent>("/learning/hint", { method: "POST", body: JSON.stringify({ concept: question?.topic ?? questionConfig.topic, helpLevel, language: question?.language ?? questionConfig.language }) })); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar a ajuda."); }
  }

  async function submitLab(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId || !labAnswer.trim()) return;
    try { setLabResult(await api<JsonRecord>(`/technical-lab/challenges/${selectedId}/attempts`, { method: "POST", body: JSON.stringify({ answer: labAnswer }) })); setLabAnswer(""); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Nao foi possivel avaliar o desafio."); }
  }

  async function revealSolution() {
    if (!selectedId) return;
    try { setLabResult(await api<JsonRecord>(`/technical-lab/challenges/${selectedId}/reveal`, { method: "POST" })); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Nao foi possivel revelar a solucao."); }
  }

  return (
    <>
      <PageHeader eyebrow="Hands-on practice" title="Technical Lab" description="Perguntas adaptativas, ajuda progressiva e desafios praticos de QA." />
      <StatusMessage message={message} />
      <div className="domain-stack">
        <section className="panel">
          <div className="panel-header"><div><h2>Banco de perguntas & Guided Learning</h2><p>Escolha um contexto e receba ajuda em etapas.</p></div><button onClick={loadQuestion}>Buscar pergunta</button></div>
          <div className="config-grid">
            <label>Tema<select value={questionConfig.topic} onChange={(event) => setQuestionConfig({ ...questionConfig, topic: event.target.value })}>{["API Testing", "SQL", "Test Design", "Automation", "Behavioral", "Agile/QA Process", ...topics.map((item) => item.topic)].filter((item, index, list) => list.indexOf(item) === index).map((topic) => <option key={topic}>{topic}</option>)}</select></label>
            <label>Idioma<select value={questionConfig.language} onChange={(event) => setQuestionConfig({ ...questionConfig, language: event.target.value as "pt-BR" | "en" })}><option value="en">Ingles</option><option value="pt-BR">Portugues</option></select></label>
            <label>Nivel<select value={questionConfig.level} onChange={(event) => setQuestionConfig({ ...questionConfig, level: Number(event.target.value) })}><option value={1}>Basico</option><option value={2}>Intermediario</option><option value={3}>Avancado</option></select></label>
          </div>
          {question ? <div className="mini-card"><strong>Nivel {question.level}: {question.topic}</strong><p>{question.prompt}</p><span>Competencia: {question.competency}</span><p><strong>Criterios:</strong> {question.criteria.join(", ")}</p><details><summary>Resposta modelo do banco</summary><p>{question.modelAnswer}</p></details></div> : null}
          <form className="answer-form" onSubmit={submitQuestion}><label>Resposta<textarea rows={5} value={questionAnswer} onChange={(event) => setQuestionAnswer(event.target.value)} /></label><div className="actions"><button>Responder</button><button type="button" className="ghost-button" onClick={() => askHint("hint")}>Dica</button><button type="button" className="ghost-button" onClick={() => askHint("explanation")}>Explicacao</button><button type="button" className="ghost-button" onClick={() => askHint("example")}>Exemplo</button><button type="button" className="ghost-button" onClick={() => askHint("model-answer")}>Resposta modelo</button></div></form>
          {hint ? <div className={`learning-card ${hint.content.blocked ? "blocked" : ""}`}><span>{hint.helpLevel}</span><p>{hint.content.explanation}</p>{hint.content.nextPrompt ? <button className="ghost-button" onClick={() => setQuestionAnswer(hint.content.nextPrompt ?? "")}>Usar como nova tentativa</button> : null}</div> : null}
          {questionResult ? <pre>{JSON.stringify(questionResult, null, 2)}</pre> : null}
        </section>
        <section className="panel">
          <div className="panel-header"><div><h2>Desafio tecnico</h2><p>Resolva um problema realista e compare com a solucao modelo.</p></div></div>
          <label>Desafio<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{challenges.map((challenge) => <option key={challenge.id} value={challenge.id}>{challenge.title}</option>)}</select></label>
          {selectedChallenge ? <div className="mini-card"><span>{selectedChallenge.area} · {selectedChallenge.difficulty}</span><p>{selectedChallenge.context}</p></div> : null}
          <form className="answer-form" onSubmit={submitLab}><label>Sua solucao<textarea rows={6} value={labAnswer} onChange={(event) => setLabAnswer(event.target.value)} /></label><div className="actions"><button>Avaliar</button><button type="button" className="ghost-button" onClick={revealSolution}>Ver solucao</button></div></form>
          {labResult ? <pre>{JSON.stringify(labResult, null, 2)}</pre> : null}
        </section>
      </div>
    </>
  );
}

export function selectChallengeId(challenges: TechnicalChallenge[], current: string, requested: string | null) {
  if (requested && challenges.some((challenge) => challenge.id === requested)) return requested;
  if (current && challenges.some((challenge) => challenge.id === current)) return current;
  return challenges[0]?.id ?? "";
}
