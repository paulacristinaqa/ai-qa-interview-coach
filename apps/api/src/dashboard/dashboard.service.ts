import { Injectable } from "@nestjs/common";
import { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma?: PrismaService) {}

  async getDashboard(user: AuthenticatedUser) {
    if (this.prisma) {
      const [sessions, attempts, latestCri] = await Promise.all([
        this.prisma.interviewSession.count({ where: { userId: user.id, status: "completed" } }),
        this.prisma.questionAttempt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
        this.prisma.criSnapshot.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
      ]);
      const avgScore = attempts.length
        ? Math.round(attempts.reduce((sum: number, attempt: { score: number }) => sum + attempt.score, 0) / attempts.length)
        : 42;
      const criScore = latestCri ? Math.round(latestCri.score) : Math.round((avgScore + sessions * 4) / 1.2);
      return this.buildDashboard(user, Math.min(100, criScore), attempts.length + sessions);
    }

    return this.buildDashboard(user, 42, 0);
  }

  private buildDashboard(user: AuthenticatedUser, criScore: number, evidenceCount: number) {
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
        nextBestAction: "Fazer uma entrevista tecnica em ingles sobre API Testing."
      },
      competencies: [
        { name: "APIs", score: 62, status: "development" },
        { name: "SQL", score: 54, status: "development" },
        { name: "Automacao", score: 58, status: "development" },
        { name: "Comunicacao", score: 46, status: "priority" },
        { name: "Ingles", score: 38, status: "priority" },
        { name: "Behavioral", score: 44, status: "priority" },
        { name: "Pensamento critico", score: 60, status: "development" }
      ],
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
}
