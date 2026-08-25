import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "../database/prisma.service";
import { FeedbackService } from "./feedback.service";

describe("FeedbackService", () => {
  it("creates English-specific feedback dimensions from interview answers", async () => {
    const create = vi.fn().mockImplementation(({ data }) => Promise.resolve({
      id: "report-1", ...data, dimensions: data.dimensions.create
    }));
    const prisma = {
      interviewSession: {
        findUnique: vi.fn().mockResolvedValue({
          id: "session-1", language: "en", turns: [{ answer: "I validate contracts and failure paths with observable evidence." }]
        })
      },
      feedbackReport: { create }
    } as unknown as PrismaService;

    const result = await new FeedbackService(prisma).generate("session-1");

    expect(result.dimensions.map((item: { dimension: string }) => item.dimension)).toContain("Naturalidade em ingles");
    expect(result.confidenceLevel).toBe("low");
  });

  it("rejects feedback for a missing session", async () => {
    const prisma = {
      interviewSession: { findUnique: vi.fn().mockResolvedValue(null) }
    } as unknown as PrismaService;

    await expect(new FeedbackService(prisma).generate("missing")).rejects.toBeInstanceOf(NotFoundException);
  });
});
