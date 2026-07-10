import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, filters: { search?: string; type?: string; tag?: string } = {}) {
    const items = await this.prisma.knowledgeItem.findMany({
      where: { userId, type: filters.type },
      orderBy: { updatedAt: "desc" }
    });
    return items.filter((item) => {
      const tags = Array.isArray(item.tags) ? item.tags.map(String) : [];
      const matchesTag = filters.tag ? tags.includes(filters.tag) : true;
      const search = filters.search?.toLowerCase();
      const matchesSearch = search
        ? item.title.toLowerCase().includes(search) || item.body.toLowerCase().includes(search) || tags.some((tag) => tag.toLowerCase().includes(search))
        : true;
      return matchesTag && matchesSearch;
    });
  }

  history(userId: string) {
    return Promise.all([
      this.prisma.interviewSession.findMany({
        where: { userId },
        orderBy: { startedAt: "desc" },
        take: 10,
        include: { turns: { orderBy: { orderIndex: "asc" } }, reports: { include: { dimensions: true } } }
      }),
      this.prisma.questionAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { question: true }
      }),
      this.prisma.technicalAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { challenge: true }
      })
    ]).then(([interviews, questionAttempts, technicalAttempts]) => ({
      interviews,
      questionAttempts,
      technicalAttempts
    }));
  }

  create(userId: string, body: { type: string; title: string; body: string; tags?: string[]; source?: string }) {
    return this.prisma.knowledgeItem.create({
      data: {
        userId,
        type: body.type,
        title: body.title,
        body: body.body,
        tags: body.tags ?? [],
        source: body.source
      }
    });
  }

  async update(userId: string, itemId: string, body: { title?: string; body?: string; tags?: string[] }) {
    const item = await this.prisma.knowledgeItem.findFirst({ where: { id: itemId, userId } });
    if (!item) {
      throw new NotFoundException("Knowledge item not found");
    }
    return this.prisma.knowledgeItem.update({
      where: { id: itemId },
      data: { title: body.title, body: body.body, tags: body.tags }
    });
  }

  async exportMarkdown(userId: string) {
    const items = await this.list(userId);
    return {
      fileName: "etqa-knowledge-base.md",
      markdown: items
        .map(
          (item: { title: string; type: string; source: string | null; body: string; tags?: unknown }) =>
            `## ${item.title}\n\nTipo: ${item.type}\nFonte: ${item.source ?? "manual"}\nTags: ${formatTags(item.tags)}\n\n${item.body}`
        )
        .join("\n\n---\n\n")
    };
  }
}

function formatTags(tags: unknown) {
  return Array.isArray(tags) ? tags.map(String).join(", ") : "";
}
