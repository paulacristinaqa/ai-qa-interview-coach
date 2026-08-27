import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "../database/prisma.service";
import { ApplicationsService } from "./applications.service";

describe("ApplicationsService", () => {
  it("lists only the user's applications and applies search and status filters", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = { jobApplication: { findMany } } as unknown as PrismaService;

    await new ApplicationsService(prisma).list("user-1", { search: "example", status: "interview" });

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        userId: "user-1",
        status: "interview",
        opportunity: { OR: expect.any(Array) }
      },
      include: expect.objectContaining({ opportunity: expect.any(Object) })
    }));
  });

  it("creates a normalized application for an owned opportunity", async () => {
    const create = vi.fn().mockImplementation(({ data }) => ({ id: "application-1", ...data }));
    const prisma = {
      jobOpportunity: { findFirst: vi.fn().mockResolvedValue({ id: "job-1", userId: "user-1" }) },
      jobApplication: { findUnique: vi.fn().mockResolvedValue(null), create }
    } as unknown as PrismaService;

    const result = await new ApplicationsService(prisma).create("user-1", {
      opportunityId: "job-1",
      status: "applied",
      appliedAt: "2026-08-27",
      nextAction: "  Prepare recruiter call  "
    });

    expect(result).toMatchObject({
      id: "application-1",
      userId: "user-1",
      opportunityId: "job-1",
      status: "applied",
      nextAction: "Prepare recruiter call"
    });
    expect(result.appliedAt).toBeInstanceOf(Date);
  });

  it("rejects an opportunity owned by another user", async () => {
    const prisma = {
      jobOpportunity: { findFirst: vi.fn().mockResolvedValue(null) },
      jobApplication: { findUnique: vi.fn(), create: vi.fn() }
    } as unknown as PrismaService;

    await expect(new ApplicationsService(prisma).create("user-1", { opportunityId: "job-2" }))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects duplicate applications and invalid dates", async () => {
    const prisma = {
      jobOpportunity: { findFirst: vi.fn().mockResolvedValue({ id: "job-1", userId: "user-1" }) },
      jobApplication: { findUnique: vi.fn().mockResolvedValue({ id: "application-1" }), create: vi.fn() }
    } as unknown as PrismaService;
    const service = new ApplicationsService(prisma);

    await expect(service.create("user-1", { opportunityId: "job-1" })).rejects.toBeInstanceOf(BadRequestException);

    prisma.jobApplication.findUnique = vi.fn().mockResolvedValue(null);
    await expect(service.create("user-1", { opportunityId: "job-1", appliedAt: "not-a-date" }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it("does not update an application owned by another user", async () => {
    const prisma = {
      jobApplication: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() }
    } as unknown as PrismaService;

    await expect(new ApplicationsService(prisma).update("user-1", "application-1", { status: "offer" }))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});
