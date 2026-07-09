import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async next(userId: string, topic?: string) {
    const attempts = await this.prisma.questionAttempt.findMany({
      where: { userId, question: topic ? { topic } : undefined },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { question: true }
    });
    const recentAverage = attempts.length
      ? attempts.reduce((sum: number, attempt: { score: number }) => sum + attempt.score, 0) / attempts.length
      : 0;
    const nextLevel = recentAverage >= 75 ? Math.min(3, (attempts[0]?.question.level ?? 1) + 1) : 1;
    return this.prisma.question.findFirst({
      where: { topic, level: nextLevel },
      orderBy: { createdAt: "asc" }
    }) ?? this.prisma.question.findFirst({ orderBy: [{ level: "asc" }, { createdAt: "asc" }] });
  }

  async attempt(userId: string, questionId: string, answer: string, helpUsed = false) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) {
      throw new NotFoundException("Question not found");
    }

    const criteria = Array.isArray(question.criteria) ? question.criteria.map((item: unknown) => String(item)) : [];
    const normalized = answer.toLowerCase();
    const matched = criteria.filter((item) => normalized.includes(item.split(" ")[0].toLowerCase()));
    const score = Math.max(25, Math.min(95, Math.round((matched.length / Math.max(criteria.length, 1)) * 80 + 15)));
    return this.prisma.questionAttempt.create({
      data: {
        userId,
        questionId,
        answer,
        helpUsed,
        score,
        result: score >= 75 ? "advance" : "practice",
        feedback: {
          matchedCriteria: matched,
          missingCriteria: criteria.filter((item: string) => !matched.includes(item)),
          recommendation: score >= 75 ? "Pode avançar para um nivel mais dificil." : "Reforce exemplos concretos e criterios tecnicos."
        }
      },
      include: { question: true }
    });
  }
}
