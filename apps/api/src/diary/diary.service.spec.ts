import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "../database/prisma.service";
import { DiaryService } from "./diary.service";

describe("DiaryService", () => {
  it("builds suggestions from recent technical evidence", async () => {
    const prisma = {
      knowledgeItem: { findMany: vi.fn().mockResolvedValue([{ title: "API learning" }]) },
      criSnapshot: { findFirst: vi.fn().mockResolvedValue({ score: 68 }) },
      technicalAttempt: { findMany: vi.fn().mockResolvedValue([{ challenge: { title: "Login API" } }]) }
    } as unknown as PrismaService;
    const result = await new DiaryService(prisma).suggestions("user-1");
    expect(result[1].context).toContain("API learning");
    expect(result[1].decision).toContain("68");
    expect(result[2].context).toContain("Login API");
  });

  it("persists a diary entry for the authenticated user", async () => {
    const create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "entry-1", ...data }));
    const prisma = { diaryEntry: { create } } as unknown as PrismaService;
    const result = await new DiaryService(prisma).create("user-1", { entryType: "changelog", title: "Coverage", decision: "Add tests" });
    expect(result.userId).toBe("user-1");
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ title: "Coverage" }) }));
  });

  it("rejects updates to an unknown entry", async () => {
    const prisma = { diaryEntry: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() } } as unknown as PrismaService;
    await expect(new DiaryService(prisma).update("user-1", "missing", { title: "Changed" })).rejects.toBeInstanceOf(NotFoundException);
  });

  it("exports entries as Markdown", async () => {
    const prisma = { diaryEntry: { findMany: vi.fn().mockResolvedValue([{ title: "ADR tests", entryType: "adr", context: "Risk", decision: "Cover", nextSteps: "E2E" }]) } } as unknown as PrismaService;
    const result = await new DiaryService(prisma).exportMarkdown("user-1");
    expect(result.markdown).toContain("## ADR tests");
    expect(result.markdown).toContain("Proximos passos: E2E");
  });
});
