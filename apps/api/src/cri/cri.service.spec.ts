import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "../database/prisma.service";
import { CriService } from "./cri.service";

function prismaFor(questionScores: number[], interviewScores: number[], technicalScores: number[]) {
  return {
    questionAttempt: { findMany: vi.fn().mockResolvedValue(questionScores.map((score) => ({ score }))) },
    feedbackDimension: { findMany: vi.fn().mockResolvedValue(interviewScores.map((score) => ({ score }))) },
    technicalAttempt: { findMany: vi.fn().mockResolvedValue(technicalScores.map((score) => ({ feedback: { score } }))) },
    criSnapshot: { create: vi.fn().mockResolvedValue({}) }
  } as unknown as PrismaService;
}

describe("CriService", () => {
  it("calculates the weighted score and persists a high-confidence snapshot", async () => {
    const prisma = prismaFor([80, 100, 90, 90, 90], [70, 80, 90, 80, 80], [60, 80, 70]);
    const result = await new CriService(prisma).current("user-1");
    expect(result.score).toBe(81);
    expect(result.confidenceLevel).toBe("high");
    expect(result.explanation.strongestPillar).toBe("perguntas");
    expect(prisma.criSnapshot.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: "user-1", score: 81 }) }));
  });

  it("uses conservative fallbacks and exposes evidence gaps without history", async () => {
    const result = await new CriService(prismaFor([], [], [])).current("user-1");
    expect(result.score).toBe(42);
    expect(result.confidenceLevel).toBe("low");
    expect(result.evidenceGaps).toHaveLength(3);
  });
});
