import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

const baseDimensions = ["Clareza", "Profundidade tecnica", "Estrutura", "Comunicacao"];

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
    const dimensions = session.language === "en" ? [...baseDimensions, "Naturalidade em ingles", "Vocabulario tecnico"] : baseDimensions;
    const created = await this.prisma.feedbackReport.create({
      data: {
        sessionId,
        overallSummary:
          answers.length === 0
            ? "Ainda nao ha respostas suficientes para um feedback confiavel."
            : buildOverallSummary(session.language, answers.length),
        confidenceLevel: answers.length >= 3 ? "medium" : "low",
        modelName: process.env.AI_PROVIDER === "openai" ? "openai-configured-provider" : "deterministic-mvp-evaluator",
        promptTemplateVersion: "mvp-feedback-v2",
        dimensions: {
          create: dimensions.map((dimension, index) => ({
            dimension,
            score: Math.max(30, Math.min(95, baseScore - index * 4)),
            evidence: answers[index % Math.max(answers.length, 1)] || "Sem resposta registrada para esta dimensao.",
            recommendation: buildRecommendation(session.language, dimension)
          }))
        }
      },
      include: { dimensions: true }
    });

    return created;
  }
}

function buildOverallSummary(language: string, answerCount: number) {
  if (language === "en") {
    return `You produced ${answerCount} interview answers with useful evidence. Next, improve clarity by using context, action, evidence, trade-off, and result. For English interviews, prioritize natural phrasing, concise technical vocabulary, and confidence under follow-up pressure.`;
  }

  return `Voce produziu ${answerCount} respostas com evidencias uteis. O proximo ganho vem de estruturar melhor contexto, acao, evidencia, trade-off e resultado.`;
}

function buildRecommendation(language: string, dimension: string) {
  if (dimension === "Naturalidade em ingles") {
    return "Use frases mais naturais de entrevista: I would start by..., The risk is..., I would validate this by...";
  }
  if (dimension === "Vocabulario tecnico") {
    return "Inclua termos tecnicos precisos em ingles, como edge case, contract validation, regression risk, flaky test e observability.";
  }
  if (language === "en") {
    return "Answer with a concise interview structure: context, action, evidence, trade-off, and result.";
  }
  return "Use uma estrutura curta: contexto, decisao, evidencia, trade-off e resultado esperado.";
}
