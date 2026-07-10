"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3001/api/v1";

interface User {
  id: string;
  name: string;
  email: string;
}

interface DashboardData {
  user: User;
  cri: { score: number; confidenceLevel: string; trend: string; limitation: string };
  interviewReadiness: { status: string; nextBestAction: string };
  competencies: Array<{ name: string; score: number; status: string }>;
  priorityCards: Array<{ id: string; title: string; score: number; severity: string; action: string }>;
  weeklyProgress: {
    completedSessions: number;
    activeSessions: number;
    questionAttempts: number;
    technicalAttempts: number;
    knowledgeItems: number;
    diaryEntries: number;
  };
  recentHistory: Array<{ type: string; title: string; detail: string; date: string }>;
  shortcuts: Array<{ id: string; label: string; topic: string }>;
  emptyState: { title: string; message: string };
}

interface InterviewSession {
  id: string;
  language: "pt-BR" | "en";
  targetRole: string;
  seniority: string;
  topic: string;
  difficulty: string;
  status: "started" | "completed";
  turns: Array<{ orderIndex: number; question: string; answer?: string; coachNote?: string }>;
}

interface Question {
  id: string;
  topic: string;
  language: "pt-BR" | "en";
  level: number;
  competency: string;
  prompt: string;
  criteria: string[];
  hints: string[];
  modelAnswer: string;
}

interface TechnicalChallenge {
  id: string;
  area: string;
  title: string;
  difficulty: string;
  context: string;
}

type JsonRecord = Record<string, unknown>;
type GrillMode = "standard" | "light-pressure" | "realistic";
type GrillLevel = "basic" | "intermediate" | "advanced";
type HelpLevel = "hint" | "explanation" | "example" | "model-answer";

interface GrillMeResponse {
  mode: GrillMode;
  level?: GrillLevel;
  sourceQuestion?: Question;
  attempt?: JsonRecord | null;
  session: InterviewSession;
}

interface QuestionTopic {
  topic: string;
  competency: string;
}

interface FeedbackReport {
  overallSummary: string;
  confidenceLevel: string;
  dimensions: Array<{ dimension: string; score: number; evidence: string; recommendation: string }>;
}

interface LearningEvent {
  helpLevel: HelpLevel;
  content: {
    blocked?: boolean;
    explanation?: string;
    nextPrompt?: string;
  };
}

export default function Home() {
  const [email, setEmail] = useState("paula@example.com");
  const [password, setPassword] = useState("change-me-locally");
  const [token, setToken] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState("Sessao local ainda nao iniciada.");
  const [feedback, setFeedback] = useState<FeedbackReport | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [questionResult, setQuestionResult] = useState<JsonRecord | null>(null);
  const [hint, setHint] = useState<LearningEvent | null>(null);
  const [questionTopics, setQuestionTopics] = useState<QuestionTopic[]>([]);
  const [questionBankCount, setQuestionBankCount] = useState(0);
  const [grillSession, setGrillSession] = useState<InterviewSession | null>(null);
  const [grillSourceQuestion, setGrillSourceQuestion] = useState<Question | null>(null);
  const [grillAnswer, setGrillAnswer] = useState("");
  const [grillResult, setGrillResult] = useState<JsonRecord | null>(null);
  const [grillConfig, setGrillConfig] = useState<{
    topic: string;
    language: "pt-BR" | "en";
    level: GrillLevel;
    mode: GrillMode;
  }>({
    topic: "API Testing",
    language: "en",
    level: "intermediate",
    mode: "light-pressure"
  });
  const [challenges, setChallenges] = useState<TechnicalChallenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState("");
  const [labAnswer, setLabAnswer] = useState("");
  const [labResult, setLabResult] = useState<JsonRecord | null>(null);
  const [knowledgeItems, setKnowledgeItems] = useState<JsonRecord[]>([]);
  const [history, setHistory] = useState<JsonRecord | null>(null);
  const [cri, setCri] = useState<JsonRecord | null>(null);
  const [diaryEntries, setDiaryEntries] = useState<JsonRecord[]>([]);
  const [exportText, setExportText] = useState("");
  const [interviewConfig, setInterviewConfig] = useState({
    language: "en",
    targetRole: "QA Automation Engineer",
    seniority: "Senior",
    topic: "API Testing",
    difficulty: "advanced"
  });
  const [knowledgeForm, setKnowledgeForm] = useState({
    type: "learning",
    title: "Aprendizado de QA",
    body: "Registrar evidencia ou conceito aprendido."
  });
  const [diaryForm, setDiaryForm] = useState({
    entryType: "decision",
    title: "Decisao tecnica",
    context: "Contexto da decisao",
    decision: "Decisao tomada",
    nextSteps: "Proximo passo"
  });

  const currentTurn = useMemo(() => session?.turns.find((turn) => !turn.answer), [session]);
  const currentGrillTurn = useMemo(() => grillSession?.turns.find((turn) => !turn.answer), [grillSession]);
  const selectedChallenge = challenges.find((challenge) => challenge.id === selectedChallengeId);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("etqa.accessToken");
    if (!savedToken) {
      return;
    }

    setIsLoading(true);
    fetch(`${apiBaseUrl}/auth/me`, { headers: { Authorization: `Bearer ${savedToken}` } })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await readApiError(response));
        }
        setToken(savedToken);
        setAuthStatus("Sessao restaurada neste navegador.");
        await loadWorkspace(savedToken);
      })
      .catch(() => {
        window.localStorage.removeItem("etqa.accessToken");
        setToken("");
        setAuthStatus("Sessao anterior expirada. Entre novamente.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
        ...options.headers
      }
    });
    if (!response.ok) {
      throw new Error(await readApiError(response));
    }
    return response.json() as Promise<T>;
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);
    try {
      const data = await api<{ accessToken: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setToken(data.accessToken);
      window.localStorage.setItem("etqa.accessToken", data.accessToken);
      setAuthStatus(`Sessao autenticada para ${data.user.name}.`);
      await loadWorkspace(data.accessToken);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Nao foi possivel conectar na API em ${apiBaseUrl}.`);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadWorkspace(accessToken = token) {
    const authHeader = { Authorization: `Bearer ${accessToken}` };
    const [dashboardData, challengeData, topicData, bankData] = await Promise.all([
      fetch(`${apiBaseUrl}/dashboard`, { headers: authHeader }).then((response) => response.json()),
      fetch(`${apiBaseUrl}/technical-lab/challenges`, { headers: authHeader }).then((response) => response.json()),
      fetch(`${apiBaseUrl}/questions/topics`, { headers: authHeader }).then((response) => response.json()),
      fetch(`${apiBaseUrl}/questions`, { headers: authHeader }).then((response) => response.json())
    ]);
    setDashboard(dashboardData as DashboardData);
    setChallenges(challengeData as TechnicalChallenge[]);
    setQuestionTopics(topicData as QuestionTopic[]);
    setQuestionBankCount((bankData as Question[]).length);
    setSelectedChallengeId((challengeData as TechnicalChallenge[])[0]?.id ?? "");
  }

  async function startInterview(topic = interviewConfig.topic) {
    const nextSession = await api<InterviewSession>("/interviews", {
      method: "POST",
      body: JSON.stringify({ ...interviewConfig, topic })
    });
    setSession(nextSession);
    setFeedback(null);
    setAnswer("");
  }

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !answer.trim()) return;
    setSession(
      await api<InterviewSession>(`/interviews/${session.id}/answers`, {
        method: "POST",
        body: JSON.stringify({ answer })
      })
    );
    setAnswer("");
  }

  async function completeInterview() {
    if (!session) return;
    setSession(await api<InterviewSession>(`/interviews/${session.id}/complete`, { method: "POST" }));
    setMessage("Sessao finalizada. Gere o feedback estruturado quando quiser.");
    await loadWorkspace();
  }

  async function generateFeedback() {
    if (!session) return;
    setFeedback(await api<FeedbackReport>(`/feedback/sessions/${session.id}`, { method: "POST" }));
  }

  async function startGrillMe() {
    const response = await api<GrillMeResponse>("/grill-me/sessions", {
      method: "POST",
      body: JSON.stringify({
        ...grillConfig,
        targetRole: interviewConfig.targetRole
      })
    });
    setGrillSession(response.session);
    setGrillSourceQuestion(response.sourceQuestion ?? null);
    setGrillAnswer("");
    setGrillResult(null);
  }

  async function submitGrillAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!grillSession || !grillAnswer.trim()) return;
    const response = await api<GrillMeResponse>(`/grill-me/sessions/${grillSession.id}/answers`, {
      method: "POST",
      body: JSON.stringify({ answer: grillAnswer, helpUsed: false })
    });
    setGrillSession(response.session);
    setGrillResult(response.attempt ?? null);
    setGrillAnswer("");
    await loadWorkspace();
  }

  async function loadQuestion() {
    const level = grillConfig.level === "advanced" ? 3 : grillConfig.level === "intermediate" ? 2 : 1;
    const params = new URLSearchParams({
      topic: grillConfig.topic,
      language: grillConfig.language,
      level: String(level)
    });
    setQuestion(await api<Question>(`/questions/next?${params.toString()}`));
    setQuestionResult(null);
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question || !questionAnswer.trim()) return;
    setQuestionResult(
      await api<JsonRecord>(`/questions/${question.id}/attempts`, {
        method: "POST",
        body: JSON.stringify({ answer: questionAnswer, helpUsed: Boolean(hint) })
      })
    );
    setQuestionAnswer("");
    await loadWorkspace();
  }

  async function askHint(helpLevel: HelpLevel) {
    setHint(
      await api<LearningEvent>("/learning/hint", {
        method: "POST",
        body: JSON.stringify({
          concept: question?.topic ?? interviewConfig.topic,
          helpLevel,
          sessionId: session?.id,
          language: question?.language ?? interviewConfig.language
        })
      })
    );
  }

  function retryWithLearningPrompt() {
    const nextPrompt = hint?.content?.nextPrompt;
    if (nextPrompt) {
      setQuestionAnswer(nextPrompt);
    }
  }

  async function submitLab(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedChallengeId || !labAnswer.trim()) return;
    setLabResult(
      await api<JsonRecord>(`/technical-lab/challenges/${selectedChallengeId}/attempts`, {
        method: "POST",
        body: JSON.stringify({ answer: labAnswer })
      })
    );
    setLabAnswer("");
    await loadWorkspace();
  }

  async function revealSolution() {
    if (!selectedChallengeId) return;
    setLabResult(await api<JsonRecord>(`/technical-lab/challenges/${selectedChallengeId}/reveal`, { method: "POST" }));
  }

  async function loadKnowledge() {
    const [items, historyData] = await Promise.all([api<JsonRecord[]>("/knowledge"), api<JsonRecord>("/knowledge/history")]);
    setKnowledgeItems(items);
    setHistory(historyData);
  }

  async function createKnowledge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await api<JsonRecord>("/knowledge", { method: "POST", body: JSON.stringify(knowledgeForm) });
    await loadKnowledge();
  }

  async function refreshCri() {
    setCri(await api<JsonRecord>("/cri/current"));
    await loadWorkspace();
  }

  async function loadDiary() {
    setDiaryEntries(await api<JsonRecord[]>("/diary/entries"));
  }

  async function createDiary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await api<JsonRecord>("/diary/entries", { method: "POST", body: JSON.stringify(diaryForm) });
    await loadDiary();
  }

  async function exportData(kind: "knowledge" | "diary") {
    const data = await api<{ markdown: string }>(kind === "knowledge" ? "/knowledge/export" : "/diary/export");
    setExportText(data.markdown);
  }

  function logout() {
    window.localStorage.removeItem("etqa.accessToken");
    setToken("");
    setDashboard(null);
    setSession(null);
    setAuthStatus("Sessao encerrada neste navegador.");
    setMessage("Sessao encerrada no cliente.");
  }

  return (
    <main className="shell">
      <section className="intro">
        <p className="eyebrow">AI QA Interview Coach</p>
        <div className="intro-row">
          <div>
            <h1>Treino de entrevista QA</h1>
            <p>Entrevistas, perguntas adaptativas, laboratorio tecnico, CRI e historico em um MVP integrado.</p>
          </div>
          {token ? <button className="ghost-button" onClick={logout}>Sair</button> : null}
        </div>
      </section>

      {!token ? (
        <form className="panel auth-panel" onSubmit={login}>
          <h2>Entrar</h2>
          <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button type="submit" disabled={isLoading}>{isLoading ? "Entrando..." : "Entrar no coach"}</button>
          <p className="helper-text">{authStatus}</p>
          {message ? <p className="status-message">{message}</p> : null}
        </form>
      ) : (
        <div className="workspace">
          {dashboard ? (
            <section className="dashboard-grid">
              <article className="score-panel">
                <span>Career Readiness Index</span>
                <strong>{dashboard.cri.score}</strong>
                <p>{dashboard.cri.confidenceLevel}: {dashboard.cri.limitation}</p>
              </article>
              <article className="panel">
                <h2>Interview Readiness</h2>
                <p>{dashboard.interviewReadiness.status}</p>
                <strong>{dashboard.interviewReadiness.nextBestAction}</strong>
              </article>
              <article className="panel wide">
                <h2>Prioridades</h2>
                <div className="priority-grid">
                  {dashboard.priorityCards.map((card) => (
                    <div className={`priority-card ${card.severity}`} key={card.id}>
                      <span>{card.title}</span>
                      <strong>{card.score || "novo"}</strong>
                      <p>{card.action}</p>
                    </div>
                  ))}
                </div>
              </article>
              <article className="panel wide">
                <h2>Progresso semanal</h2>
                <div className="metric-row">
                  <div><span>Entrevistas</span><strong>{dashboard.weeklyProgress.completedSessions}</strong></div>
                  <div><span>Perguntas</span><strong>{dashboard.weeklyProgress.questionAttempts}</strong></div>
                  <div><span>Labs</span><strong>{dashboard.weeklyProgress.technicalAttempts}</strong></div>
                  <div><span>Notas</span><strong>{dashboard.weeklyProgress.knowledgeItems}</strong></div>
                  <div><span>Diary</span><strong>{dashboard.weeklyProgress.diaryEntries}</strong></div>
                </div>
              </article>
              <article className="panel wide">
                <h2>Competencias</h2>
                <div className="competency-grid">
                  {dashboard.competencies.map((competency) => (
                    <div className={`competency ${competency.status}`} key={competency.name}>
                      <span>{competency.name}</span><strong>{competency.score}</strong>
                    </div>
                  ))}
                </div>
              </article>
              <article className="panel wide">
                <h2>Historico resumido</h2>
                {dashboard.recentHistory.length ? (
                  <div className="history-list">
                    {dashboard.recentHistory.map((item) => (
                      <div key={`${item.type}-${item.date}-${item.title}`}>
                        <span>{item.type}</span>
                        <strong>{item.title}</strong>
                        <p>{item.detail}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>{dashboard.emptyState.message}</p>
                )}
              </article>
              <article className="panel wide">
                <h2>Atalhos</h2>
                <div className="shortcut-row">
                  {dashboard.shortcuts.map((shortcut) => (
                    <button key={shortcut.id} onClick={() => startInterview(shortcut.topic)}>{shortcut.label}</button>
                  ))}
                </div>
              </article>
            </section>
          ) : null}

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Grill Me</h2>
                <p>Entrevista tecnica por tema, idioma, nivel e modo de pressao.</p>
              </div>
              <button onClick={startGrillMe}>Comecar Grill Me</button>
            </div>
            <div className="config-grid">
              <label>Tema<select value={grillConfig.topic} onChange={(event) => setGrillConfig({ ...grillConfig, topic: event.target.value })}>{["API Testing", "SQL", "Test Design", "Automation", "Behavioral", "Agile/QA Process", ...questionTopics.map((item) => item.topic)].filter((topic, index, list) => list.indexOf(topic) === index).map((topic) => <option key={topic} value={topic}>{topic}</option>)}</select></label>
              <label>Idioma<select value={grillConfig.language} onChange={(event) => setGrillConfig({ ...grillConfig, language: event.target.value as "pt-BR" | "en" })}><option value="en">Ingles</option><option value="pt-BR">Portugues</option></select></label>
              <label>Nivel<select value={grillConfig.level} onChange={(event) => setGrillConfig({ ...grillConfig, level: event.target.value as GrillLevel })}><option value="basic">Basico</option><option value="intermediate">Intermediario</option><option value="advanced">Avancado</option></select></label>
              <label>Modo<select value={grillConfig.mode} onChange={(event) => setGrillConfig({ ...grillConfig, mode: event.target.value as GrillMode })}><option value="standard">Padrao</option><option value="light-pressure">Pressao leve</option><option value="realistic">Entrevista realista</option></select></label>
            </div>
            <p className="helper-text">Banco carregado: {questionBankCount} perguntas seedadas/registradas.</p>
            {grillSourceQuestion ? (
              <div className="mini-card">
                <strong>{grillSourceQuestion.topic} - nivel {grillSourceQuestion.level}</strong>
                <p>{grillSourceQuestion.prompt}</p>
              </div>
            ) : null}
            {grillSession ? (
              <div className="session">
                <div className="session-meta"><span>{grillSession.language}</span><span>{grillSession.topic}</span><span>{grillConfig.mode}</span><span>{grillSession.status}</span></div>
                <ol className="turns">
                  {grillSession.turns.map((turn) => (
                    <li className="conversation-turn" key={turn.orderIndex}><strong>{turn.question}</strong>{turn.answer ? <p className="answer-bubble">{turn.answer}</p> : null}{turn.coachNote ? <em>{turn.coachNote}</em> : null}</li>
                  ))}
                </ol>
                {currentGrillTurn && grillSession.status === "started" ? (
                  <form className="answer-form" onSubmit={submitGrillAnswer}>
                    <label>Resposta Grill Me<textarea rows={5} value={grillAnswer} onChange={(event) => setGrillAnswer(event.target.value)} /></label>
                    <button>Responder follow-up</button>
                  </form>
                ) : <p>Grill Me finalizado. Gere feedback estruturado pela sessao se quiser consolidar a avaliacao.</p>}
                {grillResult ? <pre>{JSON.stringify(grillResult, null, 2)}</pre> : null}
              </div>
            ) : null}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div><h2>Simulador textual</h2><p>Responda ate tres rodadas e gere feedback estruturado.</p></div>
              <button onClick={() => startInterview()}>Iniciar</button>
            </div>
            <div className="config-grid">
              <label>Idioma<select value={interviewConfig.language} onChange={(event) => setInterviewConfig({ ...interviewConfig, language: event.target.value })}><option value="en">Ingles</option><option value="pt-BR">PT-BR</option></select></label>
              <label>Cargo<input value={interviewConfig.targetRole} onChange={(event) => setInterviewConfig({ ...interviewConfig, targetRole: event.target.value })} /></label>
              <label>Senioridade<input value={interviewConfig.seniority} onChange={(event) => setInterviewConfig({ ...interviewConfig, seniority: event.target.value })} /></label>
              <label>Tema<input value={interviewConfig.topic} onChange={(event) => setInterviewConfig({ ...interviewConfig, topic: event.target.value })} /></label>
            </div>
            {session ? (
              <div className="session">
                <div className="session-meta"><span>{session.language}</span><span>{session.topic}</span><span>{session.status}</span></div>
                <ol className="turns">
                  {session.turns.map((turn) => (
                    <li className="conversation-turn" key={turn.orderIndex}><strong>{turn.question}</strong>{turn.answer ? <p className="answer-bubble">{turn.answer}</p> : null}{turn.coachNote ? <em>{turn.coachNote}</em> : null}</li>
                  ))}
                </ol>
                {currentTurn && session.status === "started" ? (
                  <form className="answer-form" onSubmit={submitAnswer}>
                    <label>Sua resposta<textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={5} /></label>
                    <div className="actions"><button>Enviar resposta</button><button className="ghost-button" type="button" onClick={completeInterview}>Finalizar</button></div>
                  </form>
                ) : <button onClick={generateFeedback}>Gerar feedback estruturado</button>}
                {feedback ? (
                  <div className="feedback-panel">
                    <div>
                      <span>Confianca: {feedback.confidenceLevel}</span>
                      <p>{feedback.overallSummary}</p>
                    </div>
                    <div className="feedback-grid">
                      {feedback.dimensions.map((dimension) => (
                        <div className="feedback-card" key={dimension.dimension}>
                          <span>{dimension.dimension}</span>
                          <strong>{Math.round(dimension.score)}</strong>
                          <p>{dimension.recommendation}</p>
                          <small>{dimension.evidence}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="two-column">
            <article className="panel">
              <div className="panel-header"><div><h2>Banco de perguntas</h2><p>Questao nivelada conforme desempenho.</p></div><button onClick={loadQuestion}>Buscar</button></div>
              {question ? (
                <div className="mini-card">
                  <strong>Nivel {question.level}: {question.topic}</strong>
                  <p>{question.prompt}</p>
                  <span>Competencia: {question.competency}</span>
                  <p><strong>Criterios:</strong> {question.criteria.join(", ")}</p>
                  <p><strong>Dicas:</strong> {question.hints.join(" | ")}</p>
                  <details>
                    <summary>Resposta modelo</summary>
                    <p>{question.modelAnswer}</p>
                  </details>
                </div>
              ) : null}
              <form className="answer-form" onSubmit={submitQuestion}>
                <label>Resposta<textarea rows={4} value={questionAnswer} onChange={(event) => setQuestionAnswer(event.target.value)} /></label>
                <div className="actions">
                  <button>Responder</button>
                  <button type="button" className="ghost-button" onClick={() => askHint("hint")}>Dica</button>
                  <button type="button" className="ghost-button" onClick={() => askHint("explanation")}>Explicacao</button>
                  <button type="button" className="ghost-button" onClick={() => askHint("example")}>Exemplo</button>
                  <button type="button" className="ghost-button" onClick={() => askHint("model-answer")}>Resposta modelo</button>
                </div>
              </form>
              {hint ? (
                <div className={`learning-card ${hint.content.blocked ? "blocked" : ""}`}>
                  <span>{hint.helpLevel}</span>
                  <p>{hint.content.explanation}</p>
                  {hint.content.nextPrompt ? <button type="button" className="ghost-button" onClick={retryWithLearningPrompt}>Usar como nova tentativa</button> : null}
                </div>
              ) : null}
              {questionResult ? <pre>{JSON.stringify(questionResult, null, 2)}</pre> : null}
            </article>

            <article className="panel">
              <h2>Technical Lab</h2>
              <label>Desafio<select value={selectedChallengeId} onChange={(event) => setSelectedChallengeId(event.target.value)}>{challenges.map((challenge) => <option key={challenge.id} value={challenge.id}>{challenge.title}</option>)}</select></label>
              {selectedChallenge ? <p>{selectedChallenge.context}</p> : null}
              <form className="answer-form" onSubmit={submitLab}>
                <label>Sua solucao<textarea rows={4} value={labAnswer} onChange={(event) => setLabAnswer(event.target.value)} /></label>
                <div className="actions"><button>Avaliar</button><button type="button" className="ghost-button" onClick={revealSolution}>Ver solucao</button></div>
              </form>
              {labResult ? <pre>{JSON.stringify(labResult, null, 2)}</pre> : null}
            </article>
          </section>

          <section className="two-column">
            <article className="panel">
              <div className="panel-header"><div><h2>Knowledge Base</h2><p>Notas, aprendizados e historico.</p></div><button onClick={loadKnowledge}>Atualizar</button></div>
              <form className="answer-form" onSubmit={createKnowledge}>
                <label>Titulo<input value={knowledgeForm.title} onChange={(event) => setKnowledgeForm({ ...knowledgeForm, title: event.target.value })} /></label>
                <label>Nota<textarea rows={3} value={knowledgeForm.body} onChange={(event) => setKnowledgeForm({ ...knowledgeForm, body: event.target.value })} /></label>
                <div className="actions"><button>Salvar nota</button><button type="button" className="ghost-button" onClick={() => exportData("knowledge")}>Exportar</button></div>
              </form>
              <p>{knowledgeItems.length} itens salvos. Historico carregado: {history ? "sim" : "nao"}.</p>
            </article>

            <article className="panel">
              <div className="panel-header"><div><h2>CRI e Developer Diary</h2><p>Recalculo de prontidao e diario exportavel.</p></div><button onClick={refreshCri}>Recalcular CRI</button></div>
              {cri ? <pre>{JSON.stringify(cri, null, 2)}</pre> : null}
              <form className="answer-form" onSubmit={createDiary}>
                <label>Titulo<input value={diaryForm.title} onChange={(event) => setDiaryForm({ ...diaryForm, title: event.target.value })} /></label>
                <label>Decisao<textarea rows={3} value={diaryForm.decision} onChange={(event) => setDiaryForm({ ...diaryForm, decision: event.target.value })} /></label>
                <div className="actions"><button>Salvar diario</button><button type="button" className="ghost-button" onClick={loadDiary}>Listar</button><button type="button" className="ghost-button" onClick={() => exportData("diary")}>Exportar</button></div>
              </form>
              <p>{diaryEntries.length} entradas no diario.</p>
            </article>
          </section>

          {exportText ? <section className="panel"><h2>Exportacao Markdown</h2><textarea readOnly rows={10} value={exportText} /></section> : null}
          {message ? <p className="status-message">{message}</p> : null}
        </div>
      )}
    </main>
  );
}

async function readApiError(response: Response) {
  try {
    const data = (await response.json()) as { message?: string | string[]; error?: string };
    const message = Array.isArray(data.message) ? data.message.join(" ") : data.message;
    return message ?? data.error ?? `Falha na requisicao: ${response.status}`;
  } catch {
    return `Falha na requisicao: ${response.status}`;
  }
}
