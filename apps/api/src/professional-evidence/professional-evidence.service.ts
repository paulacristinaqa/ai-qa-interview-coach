import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { CreateEvidenceRequest, EvidenceFilters, EvidenceType, UpdateEvidenceRequest, evidenceTypes } from "./professional-evidence.types";

@Injectable()
export class ProfessionalEvidenceService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, filters: EvidenceFilters = {}) {
    const search = optionalText(filters.search, "search", 200);
    const where: Prisma.ProfessionalEvidenceWhereInput = {
      userId,
      type: filters.type ? validType(filters.type) : undefined,
      favorite: filters.favorite,
      OR: search ? [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { outcome: { contains: search, mode: "insensitive" } }
      ] : undefined
    };
    return this.prisma.professionalEvidence.findMany({ where, orderBy: [{ favorite: "desc" }, { occurredAt: "desc" }, { updatedAt: "desc" }] });
  }

  async get(userId: string, evidenceId: string) {
    const evidence = await this.prisma.professionalEvidence.findFirst({ where: { id: evidenceId, userId } });
    if (!evidence) throw new NotFoundException("Professional evidence not found");
    return evidence;
  }

  create(userId: string, body: CreateEvidenceRequest) {
    const data = validateCreate(body);
    return this.prisma.professionalEvidence.create({ data: { userId, ...data } });
  }

  async update(userId: string, evidenceId: string, body: UpdateEvidenceRequest) {
    await this.get(userId, evidenceId);
    return this.prisma.professionalEvidence.update({ where: { id: evidenceId }, data: validateUpdate(body) });
  }

  async remove(userId: string, evidenceId: string) {
    await this.get(userId, evidenceId);
    await this.prisma.professionalEvidence.delete({ where: { id: evidenceId } });
  }
}

function validateCreate(body: CreateEvidenceRequest) {
  return {
    type: validType(body.type),
    title: requiredText(body.title, "title", 200),
    description: requiredText(body.description, "description", 5000, 20),
    skills: validSkills(body.skills),
    outcome: optionalText(body.outcome, "outcome", 3000),
    sourceUrl: optionalUrl(body.sourceUrl),
    occurredAt: optionalDate(body.occurredAt),
    favorite: optionalBoolean(body.favorite)
  };
}

function validateUpdate(body: UpdateEvidenceRequest): Prisma.ProfessionalEvidenceUpdateInput {
  const data: Prisma.ProfessionalEvidenceUpdateInput = {};
  if (body.type !== undefined) data.type = validType(body.type);
  if (body.title !== undefined) data.title = requiredText(body.title, "title", 200);
  if (body.description !== undefined) data.description = requiredText(body.description, "description", 5000, 20);
  if (body.skills !== undefined) data.skills = validSkills(body.skills);
  if (body.outcome !== undefined) data.outcome = optionalText(body.outcome, "outcome", 3000);
  if (body.sourceUrl !== undefined) data.sourceUrl = optionalUrl(body.sourceUrl);
  if (body.occurredAt !== undefined) data.occurredAt = optionalDate(body.occurredAt);
  if (body.favorite !== undefined) data.favorite = optionalBoolean(body.favorite);
  return data;
}

function validType(value: unknown): EvidenceType {
  if (typeof value !== "string" || !evidenceTypes.includes(value as EvidenceType)) throw new BadRequestException("type is invalid");
  return value as EvidenceType;
}

function validSkills(value: unknown) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) throw new BadRequestException("skills must be an array of strings");
  const skills = [...new Set(value.map((item) => item.trim()).filter(Boolean))];
  if (skills.length > 25 || skills.some((item) => item.length > 100)) throw new BadRequestException("skills exceed the allowed limits");
  return skills;
}

function requiredText(value: unknown, field: string, maxLength: number, minLength = 1) {
  if (typeof value !== "string") throw new BadRequestException(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length < minLength) throw new BadRequestException(`${field} must contain at least ${minLength} characters`);
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

function optionalUrl(value: unknown) {
  const normalized = optionalText(value, "sourceUrl", 2000);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid protocol");
    return url.toString();
  } catch {
    throw new BadRequestException("sourceUrl must be a valid HTTP(S) URL");
  }
}

function optionalDate(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new BadRequestException("occurredAt must be a valid date");
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00.000Z` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) throw new BadRequestException("occurredAt must be a valid date");
  return date;
}

function optionalBoolean(value: unknown) {
  if (value === undefined) return false;
  if (typeof value !== "boolean") throw new BadRequestException("favorite must be a boolean");
  return value;
}
