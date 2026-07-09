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
    const payload = {
      score,
      confidenceLevel: evidenceCount >= 12 ? "high" : evidenceCount >= 5 ? "medium" : "low",
      composition: { questionScore, interviewScore, technicalScore, evidenceCount },
      evidenceGaps: evidenceCount < 5 ? ["Complete mais entrevistas e desafios para elevar a confianca."] : []
    };

    await this.prisma.criSnapshot.create({
      data: {
        userId,
        score,
        confidenceLevel: payload.confidenceLevel,
        composition: payload.composition,
        evidenceGaps: payload.evidenceGaps
      }
    });
    return payload;
  }
}

function average(values: number[], fallback: number) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : fallback;
}
