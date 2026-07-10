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
  level: number;
  prompt: string;
  hints: string[];
}

interface TechnicalChallenge {
  id: string;
  area: string;
  title: string;
  difficulty: string;
  context: string;
}

type JsonRecord = Record<string, unknown>;

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
  const [feedback, setFeedback] = useState<JsonRecord | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [questionResult, setQuestionResult] = useState<JsonRecord | null>(null);
  const [hint, setHint] = useState<JsonRecord | null>(null);
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
    const [dashboardData, challengeData] = await Promise.all([
      fetch(`${apiBaseUrl}/dashboard`, { headers: authHeader }).then((response) => response.json()),
      fetch(`${apiBaseUrl}/technical-lab/challenges`, { headers: authHeader }).then((response) => response.json())
    ]);
    setDashboard(dashboardData as DashboardData);
    setChallenges(challengeData as TechnicalChallenge[]);
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
    setFeedback(await api<JsonRecord>(`/feedback/sessions/${session.id}`, { method: "POST" }));
  }

  async function loadQuestion() {
    setQuestion(await api<Question>(`/questions/next?topic=${encodeURIComponent(interviewConfig.topic)}`));
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

  async function askHint(helpLevel: "hint" | "example") {
    setHint(
      await api<JsonRecord>("/learning/hint", {
        method: "POST",
        body: JSON.stringify({
          concept: question?.topic ?? interviewConfig.topic,
          helpLevel,
          sessionId: session?.id,
          language: interviewConfig.language
        })
      })
    );
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
                    <li key={turn.orderIndex}><strong>{turn.question}</strong>{turn.answer ? <p>{turn.answer}</p> : null}{turn.coachNote ? <em>{turn.coachNote}</em> : null}</li>
                  ))}
                </ol>
                {currentTurn && session.status === "started" ? (
                  <form className="answer-form" onSubmit={submitAnswer}>
                    <label>Sua resposta<textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={5} /></label>
                    <div className="actions"><button>Enviar resposta</button><button className="ghost-button" type="button" onClick={completeInterview}>Finalizar</button></div>
                  </form>
                ) : <button onClick={generateFeedback}>Gerar feedback</button>}
                {feedback ? <pre>{JSON.stringify(feedback, null, 2)}</pre> : null}
              </div>
            ) : null}
          </section>

          <section className="two-column">
            <article className="panel">
              <div className="panel-header"><div><h2>Banco de perguntas</h2><p>Questao nivelada conforme desempenho.</p></div><button onClick={loadQuestion}>Buscar</button></div>
              {question ? <div className="mini-card"><strong>Nivel {question.level}: {question.topic}</strong><p>{question.prompt}</p></div> : null}
              <form className="answer-form" onSubmit={submitQuestion}>
                <label>Resposta<textarea rows={4} value={questionAnswer} onChange={(event) => setQuestionAnswer(event.target.value)} /></label>
                <div className="actions"><button>Responder</button><button type="button" className="ghost-button" onClick={() => askHint("hint")}>Dica</button><button type="button" className="ghost-button" onClick={() => askHint("example")}>Exemplo</button></div>
              </form>
              {hint ? <pre>{JSON.stringify(hint, null, 2)}</pre> : null}
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
