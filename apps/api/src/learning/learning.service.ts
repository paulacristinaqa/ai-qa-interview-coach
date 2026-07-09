import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}

  async hint(userId: string, body: { concept: string; helpLevel?: string; sessionId?: string; language?: string }) {
    const helpLevel = body.helpLevel ?? "hint";
    const content = {
      explanation:
        helpLevel === "example"
          ? `Exemplo pratico para ${body.concept}: descreva contexto, risco, acao de teste e evidencia esperada.`
          : `Dica para ${body.concept}: comece pelo objetivo do teste e cite pelo menos um trade-off.`,
      nextPrompt: `Reescreva sua resposta incluindo um exemplo concreto de ${body.concept}.`
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
