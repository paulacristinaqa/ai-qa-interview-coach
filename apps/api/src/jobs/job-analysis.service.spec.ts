import { BadGatewayException } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AiGateway } from "../ai/ai-gateway.service";
import { MockAiProvider } from "../ai/mock-ai.provider";
import { OllamaAiProvider } from "../ai/ollama-ai.provider";
import { PrismaService } from "../database/prisma.service";
import { JobAnalysisOutput } from "./job-analysis.types";
import { JobAnalysisService } from "./job-analysis.service";
import { JobsService } from "./jobs.service";

const opportunity = {
  id: "job-1", userId: "user-1", title: "Senior QA Engineer", company: "Example", country: "Portugal", city: "Lisboa",
  workModel: "hybrid", seniority: "Senior", language: "English", link: null,
  originalDescription: "Lead API testing. Required: SQL and Playwright. Nice to have: Docker. Strong communication.",
  status: "saved", favorite: true, notes: null, createdAt: new Date(), updatedAt: new Date(), analysis: null
};

const validOutput: JobAnalysisOutput = {
  technicalSummary: "Senior QA role focused on API quality.",
  responsibilities: ["Lead API testing"],
  requiredRequirements: ["SQL", "Playwright"],
  preferredRequirements: ["Docker"],
  technologies: ["SQL", "Playwright", "Docker"],
  softSkills: ["communication"],
  estimatedSeniority: "Senior",
  profileFit: { score: 72, summary: "Good evidence with specific gaps.", evidence: ["CRI 72"] },
  gaps: ["Docker evidence"],
  preparationPlan: [{ priority: "high", action: "Prepare a Docker example", rationale: "Preferred requirement" }]
};

function prismaMock(upsert = vi.fn().mockImplementation(({ create }) => ({ id: "analysis-1", ...create }))) {
  return {
    criSnapshot: { findFirst: vi.fn().mockResolvedValue({ score: 72, confidenceLevel: "medium" }) },
    questionAttempt: { findMany: vi.fn().mockResolvedValue([]) },
    technicalAttempt: { findMany: vi.fn().mockResolvedValue([]) },
    jobAnalysis: { upsert }
  } as unknown as PrismaService;
}

describe("JobAnalysisService", () => {
  const originalProvider = process.env.AI_PROVIDER;

  afterEach(() => {
    if (originalProvider === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = originalProvider;
  });

  it("uses the mock provider, validates and persists a structured analysis", async () => {
    delete process.env.AI_PROVIDER;
    const prisma = prismaMock();
    const jobs = { get: vi.fn().mockResolvedValue(opportunity) } as unknown as JobsService;
    const ollama = { providerName: "ollama", generate: vi.fn() } as unknown as OllamaAiProvider;

    const result = await new JobAnalysisService(prisma, jobs, new AiGateway(ollama, new MockAiProvider()))
      .analyze("user-1", "job-1");

    expect(result).toMatchObject({ opportunityId: "job-1", providerName: "mock", promptTemplateVersion: "career.job-analysis@1.0.0" });
    expect(result.technologies).toEqual(expect.arrayContaining(["SQL", "Playwright", "Docker"]));
  });

  it("sends the versioned Career template and persists valid provider output", async () => {
    const prisma = prismaMock();
    const jobs = { get: vi.fn().mockResolvedValue(opportunity) } as unknown as JobsService;
    const ai = { generate: vi.fn().mockResolvedValue({
      output: validOutput,
      providerName: "ollama",
      modelName: "qwen-test",
      promptTemplateVersion: "career.job-analysis@1.0.0"
    }) } as unknown as AiGateway;

    const result = await new JobAnalysisService(prisma, jobs, ai).analyze("user-1", "job-1");

    expect(ai.generate).toHaveBeenCalledWith(expect.objectContaining({ templateId: "career.job-analysis" }), expect.any(Object));
    expect(result).toMatchObject({ modelName: "qwen-test", technicalSummary: validOutput.technicalSummary });
  });

  it("does not persist an AI response outside the schema", async () => {
    const upsert = vi.fn();
    const prisma = prismaMock(upsert);
    const jobs = { get: vi.fn().mockResolvedValue(opportunity) } as unknown as JobsService;
    const ai = { generate: vi.fn().mockResolvedValue({
      output: { ...validOutput, profileFit: { score: 150, summary: "Invalid", evidence: [] } },
      providerName: "ollama",
      modelName: "qwen-test",
      promptTemplateVersion: "career.job-analysis@1.0.0"
    }) } as unknown as AiGateway;

    await expect(new JobAnalysisService(prisma, jobs, ai).analyze("user-1", "job-1"))
      .rejects.toBeInstanceOf(BadGatewayException);
    expect(upsert).not.toHaveBeenCalled();
  });
});
