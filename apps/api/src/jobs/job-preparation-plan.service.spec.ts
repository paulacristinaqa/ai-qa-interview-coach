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
    question: { findMany: vi.fn().mockResolvedValue([{ id: "question-1", topic: "Behavioral", competency: "Communication", prompt: "Explain a release decision.", level: 2 }]) },
    technicalChallenge: { findMany: vi.fn().mockResolvedValue([
      { id: "challenge-api", area: "API", title: "API contract risks", difficulty: "advanced", context: "Analyze API risks.", evaluationCriteria: ["contract"] },
      { id: "challenge-automation", area: "Automation", title: "Automation strategy", difficulty: "basic", context: "Choose an automation approach.", evaluationCriteria: ["maintainability"] }
    ]) },
    jobPreparationPlan: { upsert, findFirst: vi.fn(), update: vi.fn() }
  } as unknown as PrismaService;
}

describe("JobPreparationPlanService", () => {
  it("creates a required-first plan for every partial match and gap", async () => {
    const generate = vi.fn().mockImplementation((_prompt, fallback) => providerResponse(fallback));
    const result = await new JobPreparationPlanService(prismaMock(), { generate } as unknown as AiGateway).generate("user-1", "job-1");
    const items = result.items as unknown as Array<Record<string, unknown>>;

    expect(result).toMatchObject({ id: "plan-1", evaluationUpdatedAt: updatedAt });
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ requirementId: "required-2", priority: "high", recommendedModule: "grill-me", documentAction: "omit-until-evidenced", progressStatus: "pending", completedAt: null });
    expect(items[0]).toMatchObject({ recommendedResource: { type: "question", id: "question-1", topic: "Behavioral" } });
    expect(items[1]).toMatchObject({ requirementId: "required-1", priority: "medium", recommendedModule: "technical-lab", documentAction: "strengthen-evidence" });
    expect(items[2]).toMatchObject({ requirementId: "preferred-1", priority: "medium", recommendedModule: "technical-lab" });
    expect(items[2]).toMatchObject({ recommendedResource: { type: "challenge", id: "challenge-automation" } });
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

  it("updates a legacy plan item and preserves its preparation data", async () => {
    const prisma = prismaMock();
    const legacyItem = { requirementId: "required-1", requirement: "API automation", actions: ["Practice"], recommendedResource: { id: "challenge-api" } };
    vi.mocked(prisma.jobPreparationPlan.findFirst).mockResolvedValue({ id: "plan-1", opportunityId: "job-1", userId: "user-1", items: [legacyItem] } as never);
    vi.mocked(prisma.jobPreparationPlan.update).mockResolvedValue({ id: "plan-1", items: [{ ...legacyItem, progressStatus: "completed", completedAt: "2026-08-29T12:00:00.000Z" }] } as never);

    const result = await new JobPreparationPlanService(prisma, {} as AiGateway)
      .updateItemStatus("user-1", "job-1", "required-1", { status: "completed" });
    const item = (result.items as unknown as Array<Record<string, unknown>>)[0];

    expect(item).toMatchObject({ ...legacyItem, progressStatus: "completed" });
    expect(item.completedAt).toEqual(expect.any(String));
    expect(prisma.jobPreparationPlan.findFirst).toHaveBeenCalledWith({ where: { opportunityId: "job-1", userId: "user-1" } });
  });

  it("clears the completion date when an item returns to in progress", async () => {
    const prisma = prismaMock();
    vi.mocked(prisma.jobPreparationPlan.findFirst).mockResolvedValue({
      id: "plan-1", opportunityId: "job-1", userId: "user-1",
      items: [{ requirementId: "required-1", progressStatus: "completed", completedAt: "2026-08-29T10:00:00.000Z" }]
    } as never);
    vi.mocked(prisma.jobPreparationPlan.update).mockResolvedValue({ id: "plan-1", items: [{ requirementId: "required-1", progressStatus: "in_progress", completedAt: null }] } as never);

    const result = await new JobPreparationPlanService(prisma, {} as AiGateway)
      .updateItemStatus("user-1", "job-1", "required-1", { status: "in_progress" });

    expect((result.items as unknown as Array<Record<string, unknown>>)[0]).toMatchObject({ progressStatus: "in_progress", completedAt: null });
  });

  it("rejects invalid progress and missing plans or items", async () => {
    const prisma = prismaMock();
    const service = new JobPreparationPlanService(prisma, {} as AiGateway);
    await expect(service.updateItemStatus("user-1", "job-1", "required-1", { status: "paused" } as never)).rejects.toBeInstanceOf(BadRequestException);

    vi.mocked(prisma.jobPreparationPlan.findFirst).mockResolvedValue(null);
    await expect(service.updateItemStatus("user-1", "job-1", "required-1", { status: "pending" })).rejects.toBeInstanceOf(NotFoundException);

    vi.mocked(prisma.jobPreparationPlan.findFirst).mockResolvedValue({ id: "plan-1", items: [{ requirementId: "other" }] } as never);
    await expect(service.updateItemStatus("user-1", "job-1", "required-1", { status: "pending" })).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.jobPreparationPlan.update).not.toHaveBeenCalled();
  });
});
