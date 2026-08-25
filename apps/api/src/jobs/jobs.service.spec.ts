import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "../database/prisma.service";
import { JobsService } from "./jobs.service";

const validJob = {
  title: "Senior QA Engineer",
  company: "Example Labs",
  country: "Portugal",
  city: "Lisboa",
  workModel: "hybrid" as const,
  seniority: "Senior",
  language: "English",
  link: "https://example.com/jobs/qa",
  originalDescription: "Own API and web quality strategy."
};

describe("JobsService", () => {
  it("lists only the user's opportunities with database filters", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = { jobOpportunity: { findMany } } as unknown as PrismaService;
    await new JobsService(prisma).list("user-1", { search: "api", status: "saved", favorite: true });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: "user-1", status: "saved", favorite: true, OR: expect.any(Array) })
    }));
  });

  it("normalizes and creates a manual opportunity", async () => {
    const create = vi.fn().mockImplementation(({ data }) => ({ id: "job-1", ...data }));
    const prisma = { jobOpportunity: { create } } as unknown as PrismaService;
    const result = await new JobsService(prisma).create("user-1", { ...validJob, title: "  Senior QA Engineer  " });
    expect(result).toMatchObject({ id: "job-1", userId: "user-1", title: "Senior QA Engineer", status: "saved", favorite: false });
  });

  it("rejects invalid URLs and non-boolean favorite values", () => {
    const prisma = { jobOpportunity: { create: vi.fn() } } as unknown as PrismaService;
    const service = new JobsService(prisma);
    expect(() => service.create("user-1", { ...validJob, link: "javascript:alert(1)" })).toThrow(BadRequestException);
    expect(() => service.create("user-1", { ...validJob, favorite: "yes" as unknown as boolean })).toThrow(BadRequestException);
  });

  it("does not update an opportunity owned by another user", async () => {
    const prisma = { jobOpportunity: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() } } as unknown as PrismaService;
    await expect(new JobsService(prisma).update("user-1", "job-1", { status: "applied" })).rejects.toBeInstanceOf(NotFoundException);
  });

  it("deletes an owned opportunity", async () => {
    const remove = vi.fn().mockResolvedValue({ id: "job-1" });
    const prisma = {
      jobOpportunity: { findFirst: vi.fn().mockResolvedValue({ id: "job-1", userId: "user-1" }), delete: remove }
    } as unknown as PrismaService;
    await new JobsService(prisma).remove("user-1", "job-1");
    expect(remove).toHaveBeenCalledWith({ where: { id: "job-1" } });
  });
});
