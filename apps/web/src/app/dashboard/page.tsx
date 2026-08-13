"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, StatusMessage } from "../../components/page";
import { useAuth } from "../../components/auth-provider";
import type { CriResponse, DashboardData, InterviewSession } from "../../lib/types";

const defaultInterview = { language: "en", targetRole: "QA Automation Engineer", seniority: "Senior", difficulty: "advanced" };

export default function DashboardPage() {
  const { api } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [cri, setCri] = useState<CriResponse | null>(null);
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(() => api<DashboardData>("/dashboard").then(setDashboard).catch((error: Error) => setMessage(error.message)), [api]);
  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  async function startInterview(topic: string) {
    try {
      const session = await api<InterviewSession>("/interviews", { method: "POST", body: JSON.stringify({ ...defaultInterview, topic }) });
      window.sessionStorage.setItem("etqa.interviewSession", JSON.stringify(session));
      router.push("/interviews");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel iniciar a entrevista.");
    }
  }

  async function refreshCri() {
    try {
      setCri(await api<CriResponse>("/cri/current"));
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel recalcular o CRI.");
    }
  }

  return (
    <>
      <PageHeader eyebrow="Overview" title="Dashboard" description="Prontidao, evidencias recentes e o proximo treino recomendado." action={<button onClick={refreshCri}>Recalcular CRI</button>} />
      <StatusMessage message={message} />
      {!dashboard ? <section className="panel">A carregar dashboard...</section> : (
        <section className="dashboard-grid">
          <article className="score-panel"><span>Career Readiness Index</span><strong>{cri?.score ?? dashboard.cri.score}</strong><p>{cri?.confidenceLevel ?? dashboard.cri.confidenceLevel}: {dashboard.cri.limitation}</p></article>
          <article className="panel"><h2>Interview Readiness</h2><p>{dashboard.interviewReadiness.status}</p><strong>{dashboard.interviewReadiness.nextBestAction}</strong></article>
          <article className="panel wide"><h2>Prioridades</h2><div className="priority-grid">{dashboard.priorityCards.map((card) => <div className={`priority-card ${card.severity}`} key={card.id}><span>{card.title}</span><strong>{card.score || "novo"}</strong><p>{card.action}</p></div>)}</div></article>
          <article className="panel wide"><h2>Progresso semanal</h2><div className="metric-row"><div><span>Entrevistas</span><strong>{dashboard.weeklyProgress.completedSessions}</strong></div><div><span>Perguntas</span><strong>{dashboard.weeklyProgress.questionAttempts}</strong></div><div><span>Labs</span><strong>{dashboard.weeklyProgress.technicalAttempts}</strong></div><div><span>Notas</span><strong>{dashboard.weeklyProgress.knowledgeItems}</strong></div><div><span>Diary</span><strong>{dashboard.weeklyProgress.diaryEntries}</strong></div></div></article>
          <article className="panel wide"><h2>Competencias</h2><div className="competency-grid">{dashboard.competencies.map((item) => <div className={`competency ${item.status}`} key={item.name}><span>{item.name}</span><strong>{item.score}</strong></div>)}</div></article>
          <article className="panel wide"><h2>Historico resumido</h2>{dashboard.recentHistory.length ? <div className="history-list">{dashboard.recentHistory.map((item) => <div key={`${item.type}-${item.date}-${item.title}`}><span>{item.type}</span><strong>{item.title}</strong><p>{item.detail}</p></div>)}</div> : <p>{dashboard.emptyState.message}</p>}</article>
          <article className="panel wide"><h2>Atalhos de treino</h2><div className="shortcut-row">{dashboard.shortcuts.map((shortcut) => <button key={shortcut.id} onClick={() => startInterview(shortcut.topic)}>{shortcut.label}</button>)}</div></article>
        </section>
      )}
    </>
  );
}
