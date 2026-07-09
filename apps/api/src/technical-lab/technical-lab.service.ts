import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class TechnicalLabService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.technicalChallenge.findMany({ orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }] });
  }

  async attempt(userId: string, challengeId: string, answer: string) {
    const challenge = await this.prisma.technicalChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) {
      throw new NotFoundException("Technical challenge not found");
    }

    const criteria = Array.isArray(challenge.evaluationCriteria)
      ? challenge.evaluationCriteria.map((criterion: unknown) => String(criterion))
      : [];
    const normalized = answer.toLowerCase();
    const covered = criteria.filter((criterion: string) => normalized.includes(criterion.split(" ")[0].toLowerCase()));
    const score = Math.max(20, Math.min(95, Math.round((covered.length / Math.max(criteria.length, 1)) * 80 + 15)));
    return this.prisma.technicalAttempt.create({
      data: {
        userId,
        challengeId,
        answer,
        feedback: {
          score,
          covered,
          missing: criteria.filter((criterion: string) => !covered.includes(criterion)),
          recommendation:
            score >= 75
              ? "Boa cobertura. Refine exemplos de dados e evidencias."
              : "Inclua criterios de avaliacao, massa de dados e riscos do cenario."
        }
      },
      include: { challenge: true }
    });
  }

  async reveal(userId: string, challengeId: string) {
    const challenge = await this.prisma.technicalChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) {
      throw new NotFoundException("Technical challenge not found");
    }

    await this.prisma.technicalAttempt.create({
      data: {
        userId,
        challengeId,
        answer: "Solution revealed before or after attempt.",
        solutionRevealed: true,
        feedback: { score: 0, recommendation: "Compare sua abordagem com a solucao modelo." }
      }
    });
    return { challengeId, modelSolution: challenge.modelSolution };
  }
}
