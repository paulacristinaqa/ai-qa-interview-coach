import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "../database/prisma.service";
import { CompaniesService } from "./companies.service";

const company = {
  id: "company-1",
  userId: "user-1",
  name: "Example Labs",
  favorite: true,
  contacts: [],
  opportunities: []
};

const companyInput = {
  name: "Example Labs",
  website: "https://example.com",
  country: "Portugal",
  industry: "Technology",
  favorite: true,
  opportunityIds: ["job-1"]
};

describe("CompaniesService", () => {
  it("creates an owned company and explicitly connects owned opportunities", async () => {
    const create = vi.fn().mockResolvedValue(company);
    const prisma = {
      company: { findFirst: vi.fn().mockResolvedValue(null), create },
      jobOpportunity: { findMany: vi.fn().mockResolvedValue([{ id: "job-1" }]) }
    } as unknown as PrismaService;

    const result = await new CompaniesService(prisma).create("user-1", companyInput);

    expect(result).toEqual(company);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: "user-1",
        name: "Example Labs",
        opportunities: { connect: [{ id: "job-1" }] }
      })
    }));
  });

  it("rejects duplicate company names without case sensitivity", async () => {
    const prisma = {
      company: { findFirst: vi.fn().mockResolvedValue({ id: "existing" }), create: vi.fn() }
    } as unknown as PrismaService;

    await expect(new CompaniesService(prisma).create("user-1", { name: "example labs" }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects associations with opportunities outside the authenticated user", async () => {
    const prisma = {
      company: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn() },
      jobOpportunity: { findMany: vi.fn().mockResolvedValue([]) }
    } as unknown as PrismaService;

    await expect(new CompaniesService(prisma).create("user-1", companyInput)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("updates company fields without replacing associations when opportunityIds are omitted", async () => {
    const update = vi.fn().mockResolvedValue({ ...company, notes: "Prepare interview context" });
    const prisma = {
      company: { findFirst: vi.fn().mockResolvedValue(company), update }
    } as unknown as PrismaService;

    await new CompaniesService(prisma).update("user-1", "company-1", { notes: "Prepare interview context" });

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ notes: "Prepare interview context", opportunities: undefined })
    }));
  });

  it("creates a validated contact only inside an owned company", async () => {
    const create = vi.fn().mockResolvedValue({ id: "contact-1", companyId: "company-1", name: "Recruiter" });
    const prisma = {
      company: { findFirst: vi.fn().mockResolvedValue(company) },
      companyContact: { create }
    } as unknown as PrismaService;

    await new CompaniesService(prisma).createContact("user-1", "company-1", {
      name: "Recruiter",
      email: "recruiter@example.com",
      linkedinUrl: "https://linkedin.com/in/recruiter"
    });

    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: "user-1", companyId: "company-1", email: "recruiter@example.com" }) });
  });

  it("does not expose or change contacts outside the company ownership boundary", async () => {
    const prisma = { companyContact: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() } } as unknown as PrismaService;

    await expect(new CompaniesService(prisma).updateContact("user-1", "company-1", "contact-2", { role: "Recruiter" }))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it("lists only authenticated companies with active filters", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = { company: { findMany } } as unknown as PrismaService;

    await new CompaniesService(prisma).list("user-1", { search: "labs", favorite: true });

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: "user-1", favorite: true }) }));
  });
});
