import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class DiaryService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.diaryEntry.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
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
