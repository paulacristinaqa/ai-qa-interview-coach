import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import {
  CompanyFilters,
  CreateCompanyContactRequest,
  CreateCompanyRequest,
  UpdateCompanyContactRequest,
  UpdateCompanyRequest
} from "./companies.types";

const companyInclude = {
  contacts: { orderBy: { updatedAt: "desc" as const } },
  opportunities: {
    select: { id: true, title: true, company: true, status: true, seniority: true, country: true },
    orderBy: { updatedAt: "desc" as const }
  }
} as const;

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, filters: CompanyFilters = {}) {
    const search = optionalText(filters.search, "search", 200);
    const where: Prisma.CompanyWhereInput = {
      userId,
      favorite: filters.favorite,
      OR: search ? [
        { name: { contains: search, mode: "insensitive" } },
        { industry: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { contacts: { some: { name: { contains: search, mode: "insensitive" } } } }
      ] : undefined
    };
    return this.prisma.company.findMany({ where, include: companyInclude, orderBy: [{ favorite: "desc" }, { updatedAt: "desc" }] });
  }

  async get(userId: string, companyId: string) {
    const company = await this.prisma.company.findFirst({ where: { id: companyId, userId }, include: companyInclude });
    if (!company) throw new NotFoundException("Company not found");
    return company;
  }

  async create(userId: string, body: CreateCompanyRequest) {
    const data = validateCompanyCreate(body);
    await this.ensureUniqueName(userId, data.name);
    const opportunityIds = await this.ownedOpportunityIds(userId, body.opportunityIds);
    return this.prisma.company.create({
      data: { userId, ...data, opportunities: { connect: opportunityIds.map((id) => ({ id })) } },
      include: companyInclude
    });
  }

  async update(userId: string, companyId: string, body: UpdateCompanyRequest) {
    const current = await this.get(userId, companyId);
    const data = validateCompanyUpdate(body);
    const nextName = typeof data.name === "string" ? data.name : undefined;
    if (nextName && nextName.toLocaleLowerCase() !== current.name.toLocaleLowerCase()) {
      await this.ensureUniqueName(userId, nextName, companyId);
    }
    const opportunityIds = body.opportunityIds === undefined ? undefined : await this.ownedOpportunityIds(userId, body.opportunityIds);
    return this.prisma.company.update({
      where: { id: companyId },
      data: {
        ...data,
        opportunities: opportunityIds ? { set: opportunityIds.map((id) => ({ id })) } : undefined
      },
      include: companyInclude
    });
  }

  async remove(userId: string, companyId: string) {
    await this.get(userId, companyId);
    await this.prisma.company.delete({ where: { id: companyId } });
  }

  async createContact(userId: string, companyId: string, body: CreateCompanyContactRequest) {
    await this.get(userId, companyId);
    return this.prisma.companyContact.create({ data: { userId, companyId, ...validateContactCreate(body) } });
  }

  async updateContact(userId: string, companyId: string, contactId: string, body: UpdateCompanyContactRequest) {
    await this.getContact(userId, companyId, contactId);
    return this.prisma.companyContact.update({ where: { id: contactId }, data: validateContactUpdate(body) });
  }

  async removeContact(userId: string, companyId: string, contactId: string) {
    await this.getContact(userId, companyId, contactId);
    await this.prisma.companyContact.delete({ where: { id: contactId } });
  }

  private async getContact(userId: string, companyId: string, contactId: string) {
    const contact = await this.prisma.companyContact.findFirst({ where: { id: contactId, companyId, userId } });
    if (!contact) throw new NotFoundException("Company contact not found");
    return contact;
  }

  private async ensureUniqueName(userId: string, name: string, excludedId?: string) {
    const duplicate = await this.prisma.company.findFirst({
      where: { userId, name: { equals: name, mode: "insensitive" }, id: excludedId ? { not: excludedId } : undefined },
      select: { id: true }
    });
    if (duplicate) throw new BadRequestException("A company with this name already exists");
  }

  private async ownedOpportunityIds(userId: string, value?: unknown) {
    if (value === undefined) return [];
    if (!Array.isArray(value) || value.some((id) => typeof id !== "string" || !id.trim())) {
      throw new BadRequestException("opportunityIds must be an array of IDs");
    }
    const ids = [...new Set(value.map((id) => id.trim()))];
    if (!ids.length) return [];
    const owned = await this.prisma.jobOpportunity.findMany({ where: { userId, id: { in: ids } }, select: { id: true } });
    if (owned.length !== ids.length) throw new BadRequestException("Every opportunity must belong to the authenticated user");
    return ids;
  }
}

function validateCompanyCreate(body: CreateCompanyRequest) {
  return {
    name: requiredText(body.name, "name", 200),
    website: optionalUrl(body.website, "website"),
    linkedinUrl: optionalUrl(body.linkedinUrl, "linkedinUrl"),
    country: optionalText(body.country, "country", 120),
    city: optionalText(body.city, "city", 120),
    industry: optionalText(body.industry, "industry", 160),
    size: optionalText(body.size, "size", 80),
    workCulture: optionalText(body.workCulture, "workCulture", 5000),
    notes: optionalText(body.notes, "notes", 10000),
    favorite: optionalBoolean(body.favorite, false)
  };
}

function validateCompanyUpdate(body: UpdateCompanyRequest): Prisma.CompanyUpdateInput {
  const data: Prisma.CompanyUpdateInput = {};
  if (body.name !== undefined) data.name = requiredText(body.name, "name", 200);
  if (body.website !== undefined) data.website = optionalUrl(body.website, "website");
  if (body.linkedinUrl !== undefined) data.linkedinUrl = optionalUrl(body.linkedinUrl, "linkedinUrl");
  if (body.country !== undefined) data.country = optionalText(body.country, "country", 120);
  if (body.city !== undefined) data.city = optionalText(body.city, "city", 120);
  if (body.industry !== undefined) data.industry = optionalText(body.industry, "industry", 160);
  if (body.size !== undefined) data.size = optionalText(body.size, "size", 80);
  if (body.workCulture !== undefined) data.workCulture = optionalText(body.workCulture, "workCulture", 5000);
  if (body.notes !== undefined) data.notes = optionalText(body.notes, "notes", 10000);
  if (body.favorite !== undefined) data.favorite = optionalBoolean(body.favorite, false);
  return data;
}

function validateContactCreate(body: CreateCompanyContactRequest) {
  return {
    name: requiredText(body.name, "name", 200),
    role: optionalText(body.role, "role", 200),
    email: optionalEmail(body.email),
    linkedinUrl: optionalUrl(body.linkedinUrl, "linkedinUrl"),
    notes: optionalText(body.notes, "notes", 5000),
    lastContactAt: optionalDate(body.lastContactAt)
  };
}

function validateContactUpdate(body: UpdateCompanyContactRequest): Prisma.CompanyContactUpdateInput {
  const data: Prisma.CompanyContactUpdateInput = {};
  if (body.name !== undefined) data.name = requiredText(body.name, "name", 200);
  if (body.role !== undefined) data.role = optionalText(body.role, "role", 200);
  if (body.email !== undefined) data.email = optionalEmail(body.email);
  if (body.linkedinUrl !== undefined) data.linkedinUrl = optionalUrl(body.linkedinUrl, "linkedinUrl");
  if (body.notes !== undefined) data.notes = optionalText(body.notes, "notes", 5000);
  if (body.lastContactAt !== undefined) data.lastContactAt = optionalDate(body.lastContactAt);
  return data;
}

function requiredText(value: unknown, field: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim()) throw new BadRequestException(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new BadRequestException(`${field} is too long`);
  return normalized;
}

function optionalText(value: unknown, field: string, maxLength: number) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new BadRequestException(`${field} is invalid`);
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new BadRequestException(`${field} is too long`);
  return normalized || null;
}

function optionalUrl(value: unknown, field: string) {
  const normalized = optionalText(value, field, 2000);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid protocol");
    return url.toString();
  } catch {
    throw new BadRequestException(`${field} must be a valid HTTP(S) URL`);
  }
}

function optionalEmail(value: unknown) {
  const normalized = optionalText(value, "email", 320);
  if (normalized && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new BadRequestException("email is invalid");
  return normalized;
}

function optionalDate(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new BadRequestException("lastContactAt must be a valid date");
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00.000Z` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) throw new BadRequestException("lastContactAt must be a valid date");
  return date;
}

function optionalBoolean(value: unknown, fallback: boolean) {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") throw new BadRequestException("favorite must be a boolean");
  return value;
}
