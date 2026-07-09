import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

const dimensions = ["Clareza", "Profundidade tecnica", "Estrutura", "Comunicacao"];

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(sessionId: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { turns: { orderBy: { orderIndex: "asc" } } }
    });
    if (!session) {
      throw new NotFoundException("Interview session not found");
    }

    const answers = session.turns.map((turn: { answer: string | null }) => turn.answer ?? "").filter(Boolean);
    const averageLength = answers.length ? answers.join(" ").length / answers.length : 0;
    const baseScore = Math.max(35, Math.min(88, Math.round(averageLength / 8 + answers.length * 12)));
    const created = await this.prisma.feedbackReport.create({
      data: {
        sessionId,
        overallSummary:
          answers.length === 0
            ? "Ainda nao ha respostas suficientes para um feedback confiavel."
            : "Voce trouxe evidencias uteis. O proximo ganho vem de estruturar melhor contexto, acao, resultado e trade-offs.",
        confidenceLevel: answers.length >= 3 ? "medium" : "low",
        modelName: process.env.AI_PROVIDER === "openai" ? "openai-configured-provider" : "deterministic-mvp-evaluator",
        promptTemplateVersion: "mvp-feedback-v1",
        dimensions: {
          create: dimensions.map((dimension, index) => ({
            dimension,
            score: Math.max(30, Math.min(95, baseScore - index * 4)),
            evidence: answers[index % Math.max(answers.length, 1)] || "Sem resposta registrada para esta dimensao.",
            recommendation: "Use uma estrutura curta: contexto, decisao, trade-off, resultado esperado."
          }))
        }
      },
      include: { dimensions: true }
    });

    return created;
  }
}
