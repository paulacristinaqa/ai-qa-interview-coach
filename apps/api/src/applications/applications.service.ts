import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import {
  applicationStatuses,
  CreateJobApplicationRequest,
  JobApplicationFilters,
  UpdateJobApplicationRequest
} from "./applications.types";

const opportunityInclude = { opportunity: { include: { analysis: true } } } as const;

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, filters: JobApplicationFilters = {}) {
    const where: Prisma.JobApplicationWhereInput = {
      userId,
      status: filters.status ? allowedStatus(filters.status) : undefined
    };
    const search = optionalText(filters.search);
    if (search) {
      where.opportunity = {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { company: { contains: search, mode: "insensitive" } }
        ]
      };
    }
    return this.prisma.jobApplication.findMany({
      where,
      include: opportunityInclude,
      orderBy: [{ nextActionAt: "asc" }, { updatedAt: "desc" }]
    });
  }

  async get(userId: string, applicationId: string) {
    const application = await this.prisma.jobApplication.findFirst({
      where: { id: applicationId, userId },
      include: opportunityInclude
    });
    if (!application) throw new NotFoundException("Job application not found");
    return application;
  }

  async create(userId: string, body: CreateJobApplicationRequest) {
    const opportunityId = requiredText(body.opportunityId, "opportunityId");
    const opportunity = await this.prisma.jobOpportunity.findFirst({ where: { id: opportunityId, userId } });
    if (!opportunity) throw new NotFoundException("Job opportunity not found");
    const existing = await this.prisma.jobApplication.findUnique({ where: { opportunityId } });
    if (existing) throw new BadRequestException("This opportunity already has an application");

    return this.prisma.jobApplication.create({
      data: { userId, opportunityId, ...validateCreate(body) },
      include: opportunityInclude
    });
  }

  async update(userId: string, applicationId: string, body: UpdateJobApplicationRequest) {
    await this.get(userId, applicationId);
    return this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: validateUpdate(body),
      include: opportunityInclude
    });
  }

  async remove(userId: string, applicationId: string) {
    await this.get(userId, applicationId);
    await this.prisma.jobApplication.delete({ where: { id: applicationId } });
  }
}

function validateCreate(body: CreateJobApplicationRequest) {
  return {
    status: allowedStatus(body.status ?? "planned"),
    appliedAt: optionalDate(body.appliedAt, "appliedAt"),
    nextAction: optionalText(body.nextAction),
    nextActionAt: optionalDate(body.nextActionAt, "nextActionAt"),
    notes: optionalText(body.notes)
  };
}

function validateUpdate(body: UpdateJobApplicationRequest): Prisma.JobApplicationUpdateInput {
  const data: Prisma.JobApplicationUpdateInput = {};
  if (body.status !== undefined) data.status = allowedStatus(body.status);
  if (body.appliedAt !== undefined) data.appliedAt = optionalDate(body.appliedAt, "appliedAt");
  if (body.nextAction !== undefined) data.nextAction = optionalText(body.nextAction);
  if (body.nextActionAt !== undefined) data.nextActionAt = optionalDate(body.nextActionAt, "nextActionAt");
  if (body.notes !== undefined) data.notes = optionalText(body.notes);
  return data;
}

function allowedStatus(value: unknown) {
  if (typeof value !== "string" || !applicationStatuses.includes(value as (typeof applicationStatuses)[number])) {
    throw new BadRequestException("status is invalid");
  }
  return value as (typeof applicationStatuses)[number];
}

function requiredText(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new BadRequestException(`${field} is required`);
  return value.trim();
}

function optionalText(value?: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new BadRequestException("optional text field is invalid");
  return value.trim() || null;
}

function optionalDate(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new BadRequestException(`${field} must be a valid date`);
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00.000Z` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) throw new BadRequestException(`${field} must be a valid date`);
  return date;
}
