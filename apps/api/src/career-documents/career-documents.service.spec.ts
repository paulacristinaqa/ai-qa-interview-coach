import { BadGatewayException, BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { AiGateway } from "../ai/ai-gateway.service";
import { PrismaService } from "../database/prisma.service";
import { CareerDocumentsService } from "./career-documents.service";

const opportunity = {
  id: "job-1",
  userId: "user-1",
  title: "Senior QA Engineer",
  company: "Example Labs",
  country: "Portugal",
  seniority: "Senior",
  language: "English",
  originalDescription: "Required API testing and SQL. Playwright is preferred.",
  analysis: {
    requiredRequirements: ["API testing", "SQL"],
    preferredRequirements: ["Playwright"]
  }
};

const request = {
  opportunityId: "job-1",
  language: "en" as const,
  candidateProfile: "I have five years of API testing experience and use SQL for data validation in QA projects."
};

function providerResponse(output: unknown) {
  return {
    output,
    providerName: "mock",
    modelName: "deterministic",
    promptTemplateVersion: "career.document-pack@2.0.0",
    confidenceLevel: "low" as const,
    limitations: [],
    createdAt: "2026-08-28T00:00:00.000Z"
  };
}

describe("CareerDocumentsService", () => {
  it("generates and persists a conservative bilingual document pack", async () => {
    const upsert = vi.fn().mockImplementation(({ create }) => ({ id: "document-1", ...create }));
    const prisma = {
      jobOpportunity: { findFirst: vi.fn().mockResolvedValue(opportunity) },
      careerDocument: { upsert }
    } as unknown as PrismaService;
    const generate = vi.fn().mockImplementation((_prompt, fallback) => providerResponse(fallback));
    const service = new CareerDocumentsService(prisma, { generate } as unknown as AiGateway);

    const result = await service.generate("user-1", request);

    expect(result).toMatchObject({ id: "document-1", language: "en", providerName: "mock" });
    expect(result.cvMarkdown).toContain("Supplied profile and evidence");
    expect(result.fitMatrix).toEqual(expect.arrayContaining([
      expect.objectContaining({ requirement: "API testing", status: "supported" }),
      expect.objectContaining({ requirement: "Playwright", status: "gap" })
    ]));
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({ promptTemplateVersion: "career.document-pack@2.0.0", language: "en" }),
      expect.objectContaining({ unsupportedClaims: [] })
    );
  });

  it("rejects an opportunity not owned by the user", async () => {
    const prisma = {
      jobOpportunity: { findFirst: vi.fn().mockResolvedValue(null) },
      careerDocument: { upsert: vi.fn() }
    } as unknown as PrismaService;
    const service = new CareerDocumentsService(prisma, { generate: vi.fn() } as unknown as AiGateway);

    await expect(service.generate("user-1", request)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects invalid language and insufficient profile evidence", async () => {
    const service = new CareerDocumentsService({} as PrismaService, {} as AiGateway);

    await expect(service.generate("user-1", { ...request, language: "fr" as "en" })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.generate("user-1", { ...request, candidateProfile: "Too short" })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("does not persist provider output with invented or missing matrix requirements", async () => {
    const upsert = vi.fn();
    const prisma = {
      jobOpportunity: { findFirst: vi.fn().mockResolvedValue(opportunity) },
      careerDocument: { upsert }
    } as unknown as PrismaService;
    const invalidOutput = {
      cvMarkdown: "# Invented CV",
      coverLetter: "Invented letter",
      fitMatrix: [{ requirement: "Invented certification", evidence: "API testing", status: "supported" }],
      unsupportedClaims: []
    };
    const service = new CareerDocumentsService(
      prisma,
      { generate: vi.fn().mockResolvedValue(providerResponse(invalidOutput)) } as unknown as AiGateway
    );

    await expect(service.generate("user-1", request)).rejects.toBeInstanceOf(BadGatewayException);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("lists only documents owned by the authenticated user", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = { careerDocument: { findMany } } as unknown as PrismaService;

    await new CareerDocumentsService(prisma, {} as AiGateway).list("user-1", "job-1");

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "user-1", opportunityId: "job-1" } }));
  });
});
