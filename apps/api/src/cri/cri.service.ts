import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class CriService {
  constructor(private readonly prisma: PrismaService) {}

  async current(userId: string) {
    const [attempts, feedbackDimensions, technicalAttempts] = await Promise.all([
      this.prisma.questionAttempt.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
      this.prisma.feedbackDimension.findMany({
        where: { report: { session: { userId } } },
        orderBy: { report: { createdAt: "desc" } },
        take: 20
      }),
      this.prisma.technicalAttempt.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 })
    ]);

    const questionScore = average(attempts.map((attempt: { score: number }) => attempt.score), 42);
    const interviewScore = average(feedbackDimensions.map((dimension: { score: number }) => dimension.score), 42);
    const technicalScore = average(
      technicalAttempts.map((attempt: { feedback: unknown }) => {
        const feedback = attempt.feedback as { score?: number };
        return feedback.score ?? 42;
      }),
      42
    );
    const score = Math.round(questionScore * 0.35 + interviewScore * 0.4 + technicalScore * 0.25);
    const evidenceCount = attempts.length + feedbackDimensions.length + technicalAttempts.length;
    const composition = { questionScore, interviewScore, technicalScore, evidenceCount };
    const evidenceGaps = buildEvidenceGaps(attempts.length, feedbackDimensions.length, technicalAttempts.length);
    const payload = {
      score,
      confidenceLevel: evidenceCount >= 12 ? "high" : evidenceCount >= 5 ? "medium" : "low",
      composition,
      evidenceGaps,
      explanation: buildExplanation(score, composition, evidenceGaps)
    };

    await this.prisma.criSnapshot.create({
      data: {
        userId,
        score,
        confidenceLevel: payload.confidenceLevel,
        composition,
        evidenceGaps
      }
    });
    return payload;
  }
}

function average(values: number[], fallback: number) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : fallback;
}

function buildEvidenceGaps(questionCount: number, feedbackCount: number, technicalCount: number) {
  const gaps = [];
  if (questionCount < 5) gaps.push("Responder pelo menos 5 perguntas niveladas para estabilizar o pilar de conhecimento.");
  if (feedbackCount < 5) gaps.push("Gerar feedback estruturado de entrevistas para medir comunicacao e profundidade.");
  if (technicalCount < 3) gaps.push("Completar pelo menos 3 desafios do Technical Lab para medir aplicacao pratica.");
  return gaps;
}

function buildExplanation(
  score: number,
  composition: { questionScore: number; interviewScore: number; technicalScore: number; evidenceCount: number },
  evidenceGaps: string[]
) {
  const strongest = [
    { name: "perguntas", score: composition.questionScore },
    { name: "entrevistas", score: composition.interviewScore },
    { name: "technical lab", score: composition.technicalScore }
  ].sort((a, b) => b.score - a.score)[0];
  return {
    summary: `Seu CRI esta em ${score}/100 porque combina desempenho em perguntas (${composition.questionScore}), entrevistas (${composition.interviewScore}) e desafios praticos (${composition.technicalScore}).`,
    strongestPillar: strongest.name,
    evidenceLevel:
      composition.evidenceCount >= 12
        ? "Ha evidencias suficientes para uma leitura mais confiavel."
        : "Ainda ha poucas evidencias, entao o score deve ser lido como direcao inicial.",
    nextBestAction: evidenceGaps[0] ?? "Manter pratica semanal e buscar consistencia nos pilares mais baixos."
  };
}
