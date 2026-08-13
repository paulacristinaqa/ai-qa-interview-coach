import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "../database/prisma.service";
import { TechnicalLabService } from "./technical-lab.service";

describe("TechnicalLabService", () => {
  it("scores covered criteria and persists feedback", async () => {
    const create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "attempt-1", ...data }));
    const prisma = { technicalChallenge: { findUnique: vi.fn().mockResolvedValue({ id: "lab-1", evaluationCriteria: ["security checks", "test data"], modelSolution: "solution" }) }, technicalAttempt: { create } } as unknown as PrismaService;
    const result = await new TechnicalLabService(prisma).attempt("user-1", "lab-1", "I would cover security checks and controlled test data with observable evidence.");
    expect((result.feedback as { covered: string[] }).covered).toEqual(["security checks", "test data"]);
    expect((result.feedback as { score: number }).score).toBeGreaterThanOrEqual(75);
  });

  it("reveals the model solution and records that action", async () => {
    const create = vi.fn().mockResolvedValue({});
    const prisma = { technicalChallenge: { findUnique: vi.fn().mockResolvedValue({ id: "lab-1", modelSolution: "Expected solution" }) }, technicalAttempt: { create } } as unknown as PrismaService;
    const result = await new TechnicalLabService(prisma).reveal("user-1", "lab-1");
    expect(result.modelSolution).toBe("Expected solution");
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ solutionRevealed: true }) }));
  });

  it("rejects an attempt for a missing challenge", async () => {
    const prisma = { technicalChallenge: { findUnique: vi.fn().mockResolvedValue(null) } } as unknown as PrismaService;
    await expect(new TechnicalLabService(prisma).attempt("user-1", "missing", "answer")).rejects.toBeInstanceOf(NotFoundException);
  });
});
