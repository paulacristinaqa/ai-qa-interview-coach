import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "../database/prisma.service";
import { KnowledgeService } from "./knowledge.service";

describe("KnowledgeService", () => {
  it("filters saved knowledge by search and tag", async () => {
    const findMany = vi.fn().mockResolvedValue([
      { id: "1", type: "learning", title: "API contracts", body: "Validate schema", tags: ["api", "contract"] },
      { id: "2", type: "learning", title: "SQL", body: "Review joins", tags: ["database"] }
    ]);
    const prisma = { knowledgeItem: { findMany } } as unknown as PrismaService;
    const result = await new KnowledgeService(prisma).list("user-1", { search: "schema", tag: "api", type: "learning" });
    expect(result.map((item) => item.id)).toEqual(["1"]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "user-1", type: "learning" } }));
  });

  it("aggregates interview, question and technical history", async () => {
    const prisma = {
      interviewSession: { findMany: vi.fn().mockResolvedValue([{ id: "session-1" }]) },
      questionAttempt: { findMany: vi.fn().mockResolvedValue([{ id: "question-1" }]) },
      technicalAttempt: { findMany: vi.fn().mockResolvedValue([{ id: "lab-1" }]) }
    } as unknown as PrismaService;
    const result = await new KnowledgeService(prisma).history("user-1");
    expect(result).toEqual({ interviews: [{ id: "session-1" }], questionAttempts: [{ id: "question-1" }], technicalAttempts: [{ id: "lab-1" }] });
  });

  it("does not update an item owned by another user", async () => {
    const prisma = { knowledgeItem: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() } } as unknown as PrismaService;
    await expect(new KnowledgeService(prisma).update("user-1", "item-1", { title: "Changed" })).rejects.toBeInstanceOf(NotFoundException);
  });

  it("exports saved items as Markdown", async () => {
    const prisma = { knowledgeItem: { findMany: vi.fn().mockResolvedValue([{ id: "1", type: "note", title: "Risk", body: "Regression evidence", tags: ["qa"], source: null }]) } } as unknown as PrismaService;
    const result = await new KnowledgeService(prisma).exportMarkdown("user-1");
    expect(result.markdown).toContain("## Risk");
    expect(result.markdown).toContain("Tags: qa");
  });
});
