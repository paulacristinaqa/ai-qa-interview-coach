import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class DiaryService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.diaryEntry.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  }

  async suggestions(userId: string) {
    const [knowledgeItems, latestCri, technicalAttempts] = await Promise.all([
      this.prisma.knowledgeItem.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 3 }),
      this.prisma.criSnapshot.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
      this.prisma.technicalAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { challenge: true }
      })
    ]);

    return [
      {
        entryType: "adr",
        title: "ADR: priorizar evidencias no feedback",
        context: "O produto precisa explicar evolucao sem prometer aprovacao em entrevista.",
        decision: "Manter feedback e CRI baseados em evidencias observaveis e nivel de confianca.",
        nextSteps: "Revisar pesos do CRI apos mais sessoes reais."
      },
      {
        entryType: "changelog",
        title: "Changelog sugerido: progresso recente",
        context: `Ultimos itens de conhecimento: ${knowledgeItems.map((item) => item.title).join(", ") || "sem notas recentes"}.`,
        decision: latestCri ? `CRI mais recente registrado com score ${latestCri.score}.` : "CRI ainda sem snapshot recente.",
        nextSteps: "Adicionar esta entrada se representar uma mudanca relevante do produto."
      },
      {
        entryType: "future_improvement",
        title: "Future improvement: aprofundar Technical Lab",
        context: `Ultimos desafios: ${technicalAttempts.map((attempt) => attempt.challenge.title).join(", ") || "sem desafios recentes"}.`,
        decision: "Adicionar desafios com dados, logs e criterios mais proximos de entrevistas reais.",
        nextSteps: "Transformar em card quando a base do MVP estiver estavel."
      }
    ];
  }

  create(
    userId: string,
    body: { entryType: string; title: string; context?: string; decision?: string; nextSteps?: string }
  ) {
    return this.prisma.diaryEntry.create({
      data: {
        userId,
        entryType: body.entryType,
        title: body.title,
        context: body.context,
        decision: body.decision,
        nextSteps: body.nextSteps
      }
    });
  }

  async update(userId: string, entryId: string, body: { title?: string; context?: string; decision?: string; nextSteps?: string }) {
    const entry = await this.prisma.diaryEntry.findFirst({ where: { id: entryId, userId } });
    if (!entry) {
      throw new NotFoundException("Diary entry not found");
    }
    return this.prisma.diaryEntry.update({ where: { id: entryId }, data: body });
  }

  async exportMarkdown(userId: string) {
    const entries = await this.list(userId);
    return {
      fileName: "etqa-developer-diary.md",
      markdown: entries
        .map(
          (entry: {
            title: string;
            entryType: string;
            context: string | null;
            decision: string | null;
            nextSteps: string | null;
          }) =>
            `## ${entry.title}\n\nTipo: ${entry.entryType}\n\nContexto: ${entry.context ?? ""}\n\nDecisao: ${
              entry.decision ?? ""
            }\n\nProximos passos: ${entry.nextSteps ?? ""}`
        )
        .join("\n\n---\n\n")
    };
  }
}
