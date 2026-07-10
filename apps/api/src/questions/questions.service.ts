import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(filters: { topic?: string; language?: string; level?: number }) {
    return this.prisma.question.findMany({
      where: {
        topic: filters.topic,
        language: filters.language,
        level: filters.level
      },
      orderBy: [{ topic: "asc" }, { language: "asc" }, { level: "asc" }, { createdAt: "asc" }]
    });
  }

  async topics() {
    const rows = await this.prisma.question.findMany({
      select: { topic: true, competency: true },
      distinct: ["topic"],
      orderBy: { topic: "asc" }
    });
    return rows.map((row) => ({ topic: row.topic, competency: row.competency }));
  }

  async next(userId: string, topic?: string, language?: string, requestedLevel?: number) {
    const attempts = await this.prisma.questionAttempt.findMany({
      where: { userId, question: { topic, language } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { question: true }
    });
    const recentAverage = attempts.length
      ? attempts.reduce((sum: number, attempt: { score: number }) => sum + attempt.score, 0) / attempts.length
      : 0;
    const inferredLevel = recentAverage >= 75 ? Math.min(3, (attempts[0]?.question.level ?? 1) + 1) : 1;
    const nextLevel = requestedLevel ?? inferredLevel;
    return this.prisma.question.findFirst({
      where: { topic, language, level: nextLevel },
      orderBy: { createdAt: "asc" }
    }) ?? this.prisma.question.findFirst({ where: { language }, orderBy: [{ level: "asc" }, { createdAt: "asc" }] });
  }

  async attempt(userId: string, questionId: string, answer: string, helpUsed = false) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) {
      throw new NotFoundException("Question not found");
    }

    const criteria = Array.isArray(question.criteria) ? question.criteria.map((item: unknown) => String(item)) : [];
    const normalized = answer.toLowerCase();
    const matched = criteria.filter((item) => matchesCriterion(normalized, item));
    const lengthBonus = answer.length >= 240 ? 10 : answer.length >= 120 ? 5 : 0;
    const score = Math.max(
      20,
      Math.min(95, Math.round((matched.length / Math.max(criteria.length, 1)) * 75 + 15 + lengthBonus))
    );
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
          recommendation: score >= 75 ? "Pode avancar para um nivel mais dificil." : "Reforce exemplos concretos, evidencias e criterios tecnicos.",
          modelAnswer: question.modelAnswer,
          hints: question.hints
        }
      },
      include: { question: true }
    });
  }
}

function matchesCriterion(answer: string, criterion: string) {
  const tokens = criterion
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 3);
  return tokens.some((token) => answer.includes(token));
}
