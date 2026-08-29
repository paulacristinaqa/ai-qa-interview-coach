import { BadGatewayException, BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { AiGateway } from "../ai/ai-gateway.service";
import { PrismaService } from "../database/prisma.service";
import { JobPreparationPlanService } from "./job-preparation-plan.service";

const updatedAt = new Date("2026-08-29T10:00:00.000Z");
const requirements = [
  { id: "required-1", text: "API automation", category: "technical", importance: "required", status: "partial" },
  { id: "required-2", text: "Release evidence", category: "experience", importance: "required", status: "gap" },
  { id: "preferred-1", text: "Docker", category: "technical", importance: "preferred", status: "gap" },
  { id: "preferred-2", text: "Communication", category: "soft_skill", importance: "preferred", status: "supported" }
];
const opportunity = {
  id: "job-1",
  userId: "user-1",
  title: "Senior QA Engineer",
  company: "Example Labs",
  language: "English",
  originalDescription: "API automation and release evidence required. Docker preferred.",
  analysis: { updatedAt },
  competencyEvaluation: { id: "evaluation-1", overallScore: 45, requirements, analysisUpdatedAt: updatedAt, updatedAt }
};

function providerResponse(output: unknown) {
  return { output, providerName: "mock", modelName: "deterministic", promptTemplateVersion: "career.preparation-plan@1.0.0" };
}

function prismaMock(upsert = vi.fn().mockImplementation(({ create }) => ({ id: "plan-1", ...create }))) {
  return {
    jobOpportunity: { findFirst: vi.fn().mockResolvedValue(opportunity) },
    jobPreparationPlan: { upsert }
  } as unknown as PrismaService;
}

describe("JobPreparationPlanService", () => {
  it("creates a required-first plan for every partial match and gap", async () => {
    const generate = vi.fn().mockImplementation((_prompt, fallback) => providerResponse(fallback));
    const result = await new JobPreparationPlanService(prismaMock(), { generate } as unknown as AiGateway).generate("user-1", "job-1");
    const items = result.items as unknown as Array<Record<string, unknown>>;

    expect(result).toMatchObject({ id: "plan-1", evaluationUpdatedAt: updatedAt });
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ requirementId: "required-2", priority: "high", recommendedModule: "grill-me", documentAction: "omit-until-evidenced" });
    expect(items[1]).toMatchObject({ requirementId: "required-1", priority: "medium", recommendedModule: "technical-lab", documentAction: "strengthen-evidence" });
    expect(items[2]).toMatchObject({ requirementId: "preferred-1", priority: "medium", recommendedModule: "technical-lab" });
    expect(generate).toHaveBeenCalledWith(expect.objectContaining({ promptTemplateVersion: "career.preparation-plan@1.0.0" }), expect.anything());
  });

  it("requires an owned opportunity with a current competency evaluation", async () => {
    const missing = { jobOpportunity: { findFirst: vi.fn().mockResolvedValue(null) } } as unknown as PrismaService;
    await expect(new JobPreparationPlanService(missing, {} as AiGateway).generate("user-1", "job-2")).rejects.toBeInstanceOf(NotFoundException);

    const withoutEvaluation = { ...opportunity, competencyEvaluation: null };
    const noEvaluation = { jobOpportunity: { findFirst: vi.fn().mockResolvedValue(withoutEvaluation) } } as unknown as PrismaService;
    await expect(new JobPreparationPlanService(noEvaluation, {} as AiGateway).generate("user-1", "job-1")).rejects.toBeInstanceOf(BadRequestException);

    const stale = { ...opportunity, competencyEvaluation: { ...opportunity.competencyEvaluation, analysisUpdatedAt: new Date("2026-08-28") } };
    const stalePrisma = { jobOpportunity: { findFirst: vi.fn().mockResolvedValue(stale) } } as unknown as PrismaService;
    await expect(new JobPreparationPlanService(stalePrisma, {} as AiGateway).generate("user-1", "job-1")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("persists an empty plan when all requirements are already supported", async () => {
    const complete = {
      ...opportunity,
      competencyEvaluation: { ...opportunity.competencyEvaluation, requirements: [requirements[3]] }
    };
    const prisma = prismaMock();
    vi.mocked(prisma.jobOpportunity.findFirst).mockResolvedValue(complete as never);
    const generate = vi.fn().mockImplementation((_prompt, fallback) => providerResponse(fallback));

    const result = await new JobPreparationPlanService(prisma, { generate } as unknown as AiGateway).generate("user-1", "job-1");
    expect(result.items).toEqual([]);
    expect(result.summary).toContain("No gaps");
  });

  it("rejects provider output that skips or reorders validated gaps", async () => {
    const upsert = vi.fn();
    const invalid = {
      summary: "Incomplete",
      items: [{
        requirementId: "preferred-1",
        requirement: "Docker",
        sourceStatus: "gap",
        priority: "medium",
        objective: "Practice Docker",
        actions: ["Practice"],
        successCriteria: ["Show evidence"],
        recommendedModule: "technical-lab",
        documentAction: "omit-until-evidenced"
      }]
    };
    const ai = { generate: vi.fn().mockResolvedValue(providerResponse(invalid)) } as unknown as AiGateway;

    await expect(new JobPreparationPlanService(prismaMock(upsert), ai).generate("user-1", "job-1"))
      .rejects.toBeInstanceOf(BadGatewayException);
    expect(upsert).not.toHaveBeenCalled();
  });
});
