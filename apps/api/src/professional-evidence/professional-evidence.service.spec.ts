import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "../database/prisma.service";
import { ProfessionalEvidenceService } from "./professional-evidence.service";

const input = {
  type: "project" as const,
  title: "API automation modernization",
  description: "Designed a Playwright API regression suite and introduced risk-based coverage.",
  skills: ["Playwright", "API Testing"],
  outcome: "Reduced the regression cycle from two days to four hours.",
  favorite: true
};

describe("ProfessionalEvidenceService", () => {
  it("creates normalized user-owned evidence", async () => {
    const create = vi.fn().mockImplementation(({ data }) => ({ id: "evidence-1", ...data }));
    const prisma = { professionalEvidence: { create } } as unknown as PrismaService;

    const result = await new ProfessionalEvidenceService(prisma).create("user-1", input);

    expect(result).toMatchObject({ id: "evidence-1", userId: "user-1", type: "project", favorite: true });
    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ skills: ["Playwright", "API Testing"] }) });
  });

  it("rejects unsupported types and descriptions without useful detail", async () => {
    const service = new ProfessionalEvidenceService({} as PrismaService);

    expect(() => service.create("user-1", { ...input, type: "secret" as "project" })).toThrow(BadRequestException);
    expect(() => service.create("user-1", { ...input, description: "Too short" })).toThrow(BadRequestException);
  });

  it("rejects invalid URLs and excessive skill lists", async () => {
    const service = new ProfessionalEvidenceService({} as PrismaService);

    expect(() => service.create("user-1", { ...input, sourceUrl: "file:///private" })).toThrow(BadRequestException);
    expect(() => service.create("user-1", { ...input, skills: Array.from({ length: 26 }, (_, index) => `skill-${index}`) })).toThrow(BadRequestException);
  });

  it("updates only evidence owned by the authenticated user", async () => {
    const update = vi.fn().mockResolvedValue({ id: "evidence-1", title: "Updated evidence" });
    const prisma = {
      professionalEvidence: { findFirst: vi.fn().mockResolvedValue({ id: "evidence-1", userId: "user-1" }), update }
    } as unknown as PrismaService;

    await new ProfessionalEvidenceService(prisma).update("user-1", "evidence-1", { title: "Updated evidence" });

    expect(update).toHaveBeenCalledWith({ where: { id: "evidence-1" }, data: { title: "Updated evidence" } });
  });

  it("returns not found across the ownership boundary", async () => {
    const prisma = { professionalEvidence: { findFirst: vi.fn().mockResolvedValue(null) } } as unknown as PrismaService;

    await expect(new ProfessionalEvidenceService(prisma).get("user-1", "foreign-evidence")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("applies search, type and favorite filters within the user", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = { professionalEvidence: { findMany } } as unknown as PrismaService;

    await new ProfessionalEvidenceService(prisma).list("user-1", { search: "api", type: "project", favorite: true });

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: "user-1", type: "project", favorite: true }) }));
  });
});
