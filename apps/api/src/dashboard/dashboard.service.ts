import { Injectable } from "@nestjs/common";
import { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";

interface DashboardEvidence {
  completedSessions: number;
  startedSessions: number;
  questionAttempts: Array<{ score: number; createdAt: Date; question?: { topic: string; competency: string } | null }>;
  technicalAttempts: Array<{ createdAt: Date; challenge?: { title: string; area: string } | null }>;
  diaryEntries: Array<{ title: string; entryType: string; updatedAt: Date }>;
  knowledgeItems: Array<{ title: string; type: string; updatedAt: Date }>;
  latestCri?: { score: number; confidenceLevel: string; createdAt: Date } | null;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma?: PrismaService) {}

  async getDashboard(user: AuthenticatedUser) {
    if (this.prisma) {
      const [completedSessions, startedSessions, questionAttempts, technicalAttempts, diaryEntries, knowledgeItems, latestCri] =
        await Promise.all([
        this.prisma.interviewSession.count({ where: { userId: user.id, status: "completed" } }),
        this.prisma.interviewSession.count({ where: { userId: user.id, status: "started" } }),
        this.prisma.questionAttempt.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { question: true }
        }),
        this.prisma.technicalAttempt.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { challenge: true }
        }),
        this.prisma.diaryEntry.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 5 }),
        this.prisma.knowledgeItem.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 5 }),
        this.prisma.criSnapshot.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
      ]);
      const avgScore = questionAttempts.length
        ? Math.round(
            questionAttempts.reduce((sum: number, attempt: { score: number }) => sum + attempt.score, 0) /
              questionAttempts.length
          )
        : 42;
      const criScore = latestCri ? Math.round(latestCri.score) : Math.round((avgScore + completedSessions * 4) / 1.2);
      return this.buildDashboard(user, Math.min(100, criScore), {
        completedSessions,
        startedSessions,
        questionAttempts,
        technicalAttempts,
        diaryEntries,
        knowledgeItems,
        latestCri
      });
    }

    return this.buildDashboard(user, 42, {
      completedSessions: 0,
      startedSessions: 0,
      questionAttempts: [],
      technicalAttempts: [],
      diaryEntries: [],
      knowledgeItems: []
    });
  }

  private buildDashboard(user: AuthenticatedUser, criScore: number, evidence: DashboardEvidence) {
    const evidenceCount =
      evidence.completedSessions + evidence.questionAttempts.length + evidence.technicalAttempts.length;
    const weeklyProgress = this.buildWeeklyProgress(evidence);
    const competencies = this.buildCompetencies(evidence.questionAttempts);
    const priorityCards = this.buildPriorityCards(competencies, weeklyProgress);
    const recentHistory = this.buildRecentHistory(evidence);

    return {
      user,
      cri: {
        score: criScore,
        confidenceLevel: evidenceCount >= 6 ? "medium" : "low",
        trend: evidenceCount > 0 ? "evidence-based" : "initial-baseline",
        limitation:
          evidenceCount > 0
            ? `Baseado em ${evidenceCount} evidencias do MVP.`
            : "Ainda ha poucas evidencias. O score inicial serve apenas como ponto de partida."
      },
      interviewReadiness: {
        status: "em desenvolvimento",
        nextBestAction: priorityCards[0]?.action ?? "Fazer uma entrevista tecnica em ingles sobre API Testing."
      },
      competencies,
      priorityCards,
      weeklyProgress,
      recentHistory,
      shortcuts: [
        { id: "weak-point", label: "Treinar ponto fraco", target: "interview", topic: "English technical communication" },
        { id: "start-interview", label: "Iniciar entrevista", target: "interview", topic: "API Testing" },
        { id: "warm-up", label: "Warm-up rapido", target: "interview", topic: "QA interview warm-up" },
        { id: "review-today", label: "Revisar hoje", target: "knowledge", topic: "Sem revisoes pendentes no MVP inicial" }
      ],
      emptyState: {
        title: "Historico ainda esta vazio",
        message: "Complete uma entrevista textual para gerar evidencias reais de evolucao."
      }
    };
  }

  private buildCompetencies(attempts: DashboardEvidence["questionAttempts"]) {
    const defaults = [
      { name: "APIs", score: 62, status: "development" },
      { name: "SQL", score: 54, status: "development" },
      { name: "Automacao", score: 58, status: "development" },
      { name: "Comunicacao", score: 46, status: "priority" },
      { name: "Ingles", score: 38, status: "priority" },
      { name: "Behavioral", score: 44, status: "priority" },
      { name: "Pensamento critico", score: 60, status: "development" }
    ];

    return defaults.map((competency) => {
      const related = attempts.filter((attempt) => attempt.question?.competency === competency.name);
      const score = related.length
        ? Math.round(related.reduce((sum, attempt) => sum + attempt.score, 0) / related.length)
        : competency.score;
      return {
        ...competency,
        score,
        status: score < 55 ? "priority" : score >= 75 ? "strong" : "development"
      };
    });
  }

  private buildPriorityCards(
    competencies: Array<{ name: string; score: number; status: string }>,
    weeklyProgress: { completedSessions: number; questionAttempts: number; technicalAttempts: number }
  ) {
    const weakest = [...competencies].sort((a, b) => a.score - b.score).slice(0, 3);
    const cards = weakest.map((competency, index) => ({
      id: `priority-${competency.name.toLowerCase().replace(/\s+/g, "-")}`,
      title: competency.name,
      score: competency.score,
      severity: index === 0 ? "high" : "medium",
      action:
        competency.name === "Ingles"
          ? "Fazer Grill Me em ingles com respostas curtas e naturais."
          : `Treinar ${competency.name} com uma pergunta nivelada e uma justificativa tecnica.`
    }));

    if (weeklyProgress.completedSessions === 0) {
      cards.unshift({
        id: "weekly-interview",
        title: "Entrevista da semana",
        score: 0,
        severity: "high",
        action: "Completar ao menos uma entrevista textual para gerar evidencias reais."
      });
    }

    return cards.slice(0, 4);
  }

  private buildWeeklyProgress(evidence: DashboardEvidence) {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return {
      completedSessions: evidence.completedSessions,
      activeSessions: evidence.startedSessions,
      questionAttempts: evidence.questionAttempts.filter((attempt) => attempt.createdAt >= startOfWeek).length,
      technicalAttempts: evidence.technicalAttempts.filter((attempt) => attempt.createdAt >= startOfWeek).length,
      knowledgeItems: evidence.knowledgeItems.filter((item) => item.updatedAt >= startOfWeek).length,
      diaryEntries: evidence.diaryEntries.filter((entry) => entry.updatedAt >= startOfWeek).length
    };
  }

  private buildRecentHistory(evidence: DashboardEvidence) {
    const events = [
      ...evidence.questionAttempts.slice(0, 5).map((attempt) => ({
        type: "Pergunta",
        title: attempt.question?.topic ?? "Pergunta nivelada",
        detail: `Score ${Math.round(attempt.score)}`,
        date: attempt.createdAt.toISOString()
      })),
      ...evidence.technicalAttempts.slice(0, 3).map((attempt) => ({
        type: "Technical Lab",
        title: attempt.challenge?.title ?? "Desafio tecnico",
        detail: attempt.challenge?.area ?? "Pratica",
        date: attempt.createdAt.toISOString()
      })),
      ...evidence.knowledgeItems.slice(0, 3).map((item) => ({
        type: "Knowledge",
        title: item.title,
        detail: item.type,
        date: item.updatedAt.toISOString()
      })),
      ...evidence.diaryEntries.slice(0, 3).map((entry) => ({
        type: "Diary",
        title: entry.title,
        detail: entry.entryType,
        date: entry.updatedAt.toISOString()
      }))
    ];

    return events.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  }
}
