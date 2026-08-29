import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import {
  CreateJobOpportunityRequest,
  JobOpportunityFilters,
  UpdateJobOpportunityRequest,
  jobStatuses,
  workModels
} from "./jobs.types";

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, filters: JobOpportunityFilters = {}) {
    const where: Prisma.JobOpportunityWhereInput = {
      userId,
      status: filters.status ? allowedValue(filters.status, jobStatuses, "status") : undefined,
      workModel: filters.workModel ? allowedValue(filters.workModel, workModels, "workModel") : undefined,
      seniority: optionalText(filters.seniority) ?? undefined,
      favorite: filters.favorite
    };
    const search = filters.search?.trim();
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } }
      ];
    }
    return this.prisma.jobOpportunity.findMany({
      where,
      include: { analysis: true, competencyEvaluation: true, preparationPlan: true, application: { select: { id: true } } },
      orderBy: [{ favorite: "desc" }, { updatedAt: "desc" }]
    });
  }

  async get(userId: string, opportunityId: string) {
    const opportunity = await this.prisma.jobOpportunity.findFirst({
      where: { id: opportunityId, userId },
      include: { analysis: true, competencyEvaluation: true, preparationPlan: true, application: { select: { id: true } } }
    });
    if (!opportunity) throw new NotFoundException("Job opportunity not found");
    return opportunity;
  }

  create(userId: string, body: CreateJobOpportunityRequest) {
    return this.prisma.jobOpportunity.create({ data: { userId, ...validateCreate(body) } });
  }

  async update(userId: string, opportunityId: string, body: UpdateJobOpportunityRequest) {
    await this.get(userId, opportunityId);
    return this.prisma.jobOpportunity.update({
      where: { id: opportunityId },
      data: validateUpdate(body),
      include: { analysis: true, competencyEvaluation: true, preparationPlan: true, application: { select: { id: true } } }
    });
  }

  async remove(userId: string, opportunityId: string) {
    await this.get(userId, opportunityId);
    await this.prisma.jobOpportunity.delete({ where: { id: opportunityId } });
  }
}

function validateCreate(body: CreateJobOpportunityRequest) {
  return {
    title: requiredText(body.title, "title"),
    company: requiredText(body.company, "company"),
    country: requiredText(body.country, "country"),
    city: optionalText(body.city),
    workModel: allowedValue(body.workModel, workModels, "workModel"),
    seniority: requiredText(body.seniority, "seniority"),
    language: requiredText(body.language, "language"),
    link: validLink(body.link),
    originalDescription: requiredText(body.originalDescription, "originalDescription"),
    status: allowedValue(body.status ?? "saved", jobStatuses, "status"),
    favorite: optionalBoolean(body.favorite, false, "favorite"),
    notes: optionalText(body.notes)
  };
}

function validateUpdate(body: UpdateJobOpportunityRequest): Prisma.JobOpportunityUpdateInput {
  const data: Prisma.JobOpportunityUpdateInput = {};
  if (body.title !== undefined) data.title = requiredText(body.title, "title");
  if (body.company !== undefined) data.company = requiredText(body.company, "company");
  if (body.country !== undefined) data.country = requiredText(body.country, "country");
  if (body.city !== undefined) data.city = optionalText(body.city);
  if (body.workModel !== undefined) data.workModel = allowedValue(body.workModel, workModels, "workModel");
  if (body.seniority !== undefined) data.seniority = requiredText(body.seniority, "seniority");
  if (body.language !== undefined) data.language = requiredText(body.language, "language");
  if (body.link !== undefined) data.link = validLink(body.link);
  if (body.originalDescription !== undefined) data.originalDescription = requiredText(body.originalDescription, "originalDescription");
  if (body.status !== undefined) data.status = allowedValue(body.status, jobStatuses, "status");
  if (body.favorite !== undefined) data.favorite = optionalBoolean(body.favorite, false, "favorite");
  if (body.notes !== undefined) data.notes = optionalText(body.notes);
  return data;
}

function requiredText(value: unknown, field: string) {
  if (typeof value !== "string") throw new BadRequestException(`${field} is required`);
  const normalized = value.trim();
  if (!normalized) throw new BadRequestException(`${field} is required`);
  return normalized;
}

function optionalText(value?: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new BadRequestException("optional text field is invalid");
  return value.trim() || null;
}

function allowedValue<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) throw new BadRequestException(`${field} is invalid`);
  return value as T;
}

function optionalBoolean(value: unknown, fallback: boolean, field: string) {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") throw new BadRequestException(`${field} must be a boolean`);
  return value;
}

function validLink(value?: unknown) {
  const normalized = optionalText(value);
  if (!normalized) return null;
  try {
    const link = new URL(normalized);
    if (!["http:", "https:"].includes(link.protocol)) throw new Error("Invalid protocol");
    return link.toString();
  } catch {
    throw new BadRequestException("link must be a valid HTTP(S) URL");
  }
}
