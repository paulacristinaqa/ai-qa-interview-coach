import { BadGatewayException, BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { AiGateway } from "../ai/ai-gateway.service";
import { PrismaService } from "../database/prisma.service";
import { CompetencyEvaluationService } from "./competency-evaluation.service";

const analysisUpdatedAt = new Date("2026-08-29T08:00:00.000Z");
const opportunity = {
  id: "job-1",
  userId: "user-1",
  title: "Senior QA Engineer",
  company: "Example Labs",
  language: "English",
  originalDescription: "Required SQL and Playwright automation. Strong communication skills. Docker preferred.",
  analysis: {
    updatedAt: analysisUpdatedAt,
    requiredRequirements: ["SQL and Playwright automation", "Strong communication skills"],
    preferredRequirements: ["Docker"]
  }
};

const evidence = [
  {
    id: "evidence-1",
    userId: "user-1",
    type: "project",
    title: "Playwright automation",
    description: "Built Playwright automation with SQL validation for an API platform.",
    skills: ["Playwright", "SQL", "Automation"],
    outcome: "Reduced regression time."
  },
  {
    id: "evidence-2",
    userId: "user-1",
    type: "experience",
    title: "QA team communication",
    description: "Used strong communication skills with developers and product teams.",
    skills: ["Communication"],
    outcome: null
  }
];

function providerResponse(output: unknown) {
  return {
    output,
    providerName: "mock",
    modelName: "deterministic",
    promptTemplateVersion: "career.competency-evaluation@1.0.0"
  };
}

function prismaMock(upsert = vi.fn().mockImplementation(({ create }) => ({ id: "evaluation-1", ...create }))) {
  return {
    jobOpportunity: { findFirst: vi.fn().mockResolvedValue(opportunity) },
    professionalEvidence: { findMany: vi.fn().mockResolvedValue(evidence) },
    competencyEvaluation: { upsert }
  } as unknown as PrismaService;
}

describe("CompetencyEvaluationService", () => {
  it("evaluates every analyzed requirement using only selected evidence IDs", async () => {
    const prisma = prismaMock();
    const generate = vi.fn().mockImplementation((_prompt, fallback) => providerResponse(fallback));

    const result = await new CompetencyEvaluationService(prisma, { generate } as unknown as AiGateway).evaluate(
      "user-1",
      "job-1",
      { evidenceIds: ["evidence-1", "evidence-2"] }
    );

    expect(result).toMatchObject({ id: "evaluation-1", overallScore: 80, evidenceIds: ["evidence-1", "evidence-2"] });
    expect(result.requirements).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "required-1", status: "supported", evidenceIds: ["evidence-1"] }),
      expect.objectContaining({ id: "preferred-1", status: "gap", evidenceIds: [] })
    ]));
    expect(generate).toHaveBeenCalledWith(expect.objectContaining({ promptTemplateVersion: "career.competency-evaluation@1.0.0" }), expect.anything());
  });

  it("requires a structured job analysis and at least one evidence item", async () => {
    const noAnalysis = { ...opportunity, analysis: null };
    const prisma = {
      jobOpportunity: { findFirst: vi.fn().mockResolvedValue(noAnalysis) },
      professionalEvidence: { findMany: vi.fn().mockResolvedValue(evidence) }
    } as unknown as PrismaService;
    const service = new CompetencyEvaluationService(prisma, {} as AiGateway);

    await expect(service.evaluate("user-1", "job-1", { evidenceIds: [] })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.evaluate("user-1", "job-1", { evidenceIds: ["evidence-1"] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects jobs and evidence outside the authenticated user boundary", async () => {
    const missingJob = {
      jobOpportunity: { findFirst: vi.fn().mockResolvedValue(null) },
      professionalEvidence: { findMany: vi.fn().mockResolvedValue([]) }
    } as unknown as PrismaService;
    await expect(new CompetencyEvaluationService(missingJob, {} as AiGateway).evaluate("user-1", "job-2", { evidenceIds: ["evidence-1"] }))
      .rejects.toBeInstanceOf(NotFoundException);

    const foreignEvidence = prismaMock();
    vi.mocked(foreignEvidence.professionalEvidence.findMany).mockResolvedValue([]);
    await expect(new CompetencyEvaluationService(foreignEvidence, {} as AiGateway).evaluate("user-1", "job-1", { evidenceIds: ["foreign"] }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it("does not persist provider output with invented evidence IDs", async () => {
    const upsert = vi.fn();
    const prisma = prismaMock(upsert);
    const invalid = {
      summary: "Invented",
      overallScore: 100,
      requirements: [
        { id: "required-1", text: "SQL and Playwright automation", category: "technical", importance: "required", status: "supported", confidence: 1, evidenceIds: ["invented"], rationale: "Invented", documentGuidance: "Invented" },
        { id: "required-2", text: "Strong communication skills", category: "soft_skill", importance: "required", status: "supported", confidence: 1, evidenceIds: ["evidence-2"], rationale: "Match", documentGuidance: "Use it" },
        { id: "preferred-1", text: "Docker", category: "technical", importance: "preferred", status: "gap", confidence: 1, evidenceIds: [], rationale: "Gap", documentGuidance: "Do not claim" }
      ]
    };
    const ai = { generate: vi.fn().mockResolvedValue(providerResponse(invalid)) } as unknown as AiGateway;

    await expect(new CompetencyEvaluationService(prisma, ai).evaluate("user-1", "job-1", { evidenceIds: ["evidence-1", "evidence-2"] }))
      .rejects.toBeInstanceOf(BadGatewayException);
    expect(upsert).not.toHaveBeenCalled();
  });
});
