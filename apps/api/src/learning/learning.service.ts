import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

type HelpLevel = "hint" | "explanation" | "example" | "model-answer";

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}

  async hint(userId: string, body: { concept: string; helpLevel?: string; sessionId?: string; language?: string }) {
    const helpLevel = resolveHelpLevel(body.helpLevel);
    const priorEvents = await this.prisma.learningEvent.findMany({
      where: { userId, sessionId: body.sessionId, concept: body.concept },
      orderBy: { createdAt: "asc" }
    });
    const allowed = helpLevel !== "model-answer" || hasProgressiveSupport(priorEvents.map((event) => event.helpLevel));
    const content = allowed
      ? buildLearningContent(body.concept, helpLevel, body.language ?? "pt-BR")
      : {
          blocked: true,
          explanation:
            "Resposta modelo bloqueada por enquanto. Primeiro use dica, explicacao e exemplo para estimular raciocinio antes de ver a resposta completa.",
          nextPrompt: `Tente novamente explicando ${body.concept} com contexto, evidencia e trade-off.`
        };

    return this.prisma.learningEvent.create({
      data: {
        userId,
        sessionId: body.sessionId,
        concept: body.concept,
        helpLevel,
        retryRequested: true,
        language: body.language ?? "pt-BR",
        content
      }
    });
  }
}

function resolveHelpLevel(helpLevel?: string): HelpLevel {
  if (helpLevel === "explanation" || helpLevel === "example" || helpLevel === "model-answer") {
    return helpLevel;
  }
  return "hint";
}

function hasProgressiveSupport(levels: string[]) {
  return ["hint", "explanation", "example"].every((level) => levels.includes(level));
}

function buildLearningContent(concept: string, helpLevel: HelpLevel, language: string) {
  if (language === "en") {
    const contentByLevel = {
      hint: `Quick hint for ${concept}: name the risk first, then say how you would prove quality.`,
      explanation: `${concept} answers work best when you separate context, risk, test action, evidence, and trade-off.`,
      example: `Example for ${concept}: I would validate the contract, cover success and failure paths, check observability, and explain the regression risk.`,
      "model-answer": `Model answer: I would start by clarifying the expected behavior for ${concept}, identify the main risk, design positive and negative tests, define observable evidence, and explain the trade-off between coverage and speed.`
    };
    return {
      explanation: contentByLevel[helpLevel],
      nextPrompt: `Try again in English using context, action, evidence, trade-off, and result for ${concept}.`
    };
  }

  const contentByLevel = {
    hint: `Dica curta para ${concept}: nomeie o risco primeiro e diga como provaria qualidade.`,
    explanation: `Uma boa resposta sobre ${concept} separa contexto, risco, acao de teste, evidencia e trade-off.`,
    example: `Exemplo para ${concept}: eu validaria contrato, caminhos de sucesso e erro, observabilidade e risco de regressao.`,
    "model-answer": `Resposta modelo: eu comecaria esclarecendo o comportamento esperado de ${concept}, identificaria o principal risco, desenharia testes positivos e negativos, definiria evidencias observaveis e explicaria o trade-off entre cobertura e velocidade.`
  };
  return {
    explanation: contentByLevel[helpLevel],
    nextPrompt: `Tente novamente usando contexto, acao, evidencia, trade-off e resultado para ${concept}.`
  };
}
