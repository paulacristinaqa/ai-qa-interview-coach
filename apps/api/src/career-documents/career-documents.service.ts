import { BadGatewayException, BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AiGateway } from "../ai/ai-gateway.service";
import { careerDocumentPackSchema, validateAiOutput } from "../ai/ai-output-schemas";
import { createPromptRequest } from "../ai/prompts/prompt-template.registry";
import { PrismaService } from "../database/prisma.service";
import { CareerDocumentOutput, CareerDocumentLanguage, GenerateCareerDocumentRequest } from "./career-documents.types";

const documentInclude = {
  opportunity: { select: { id: true, title: true, company: true, country: true, city: true, workModel: true, seniority: true, language: true } }
} as const;

@Injectable()
export class CareerDocumentsService {
  constructor(private readonly prisma: PrismaService, private readonly ai: AiGateway) {}

  list(userId: string, opportunityId?: string) {
    return this.prisma.careerDocument.findMany({
      where: { userId, opportunityId: opportunityId?.trim() || undefined },
      include: documentInclude,
      orderBy: { updatedAt: "desc" }
    });
  }

  async get(userId: string, documentId: string) {
    const document = await this.prisma.careerDocument.findFirst({
      where: { id: documentId, userId },
      include: documentInclude
    });
    if (!document) throw new NotFoundException("Career document not found");
    return document;
  }

  async generate(userId: string, request: GenerateCareerDocumentRequest) {
    const opportunityId = requiredText(request.opportunityId, "opportunityId", 200);
    const language = validLanguage(request.language);
    const candidateProfile = requiredText(request.candidateProfile, "candidateProfile", 20_000);
    if (candidateProfile.length < 40) throw new BadRequestException("candidateProfile must contain at least 40 characters");

    const opportunity = await this.prisma.jobOpportunity.findFirst({
      where: { id: opportunityId, userId },
      include: { analysis: true }
    });
    if (!opportunity) throw new NotFoundException("Job opportunity not found");

    const fallback = buildDeterministicDocumentPack(opportunity, language, candidateProfile);
    const generated = await this.ai.generate<CareerDocumentOutput>(
      createPromptRequest("career.document-pack", {
        language,
        userInput: candidateProfile,
        context: {
          candidateProfile,
          jobOpportunity: {
            title: opportunity.title,
            company: opportunity.company,
            country: opportunity.country,
            seniority: opportunity.seniority,
            statedLanguage: opportunity.language,
            originalDescription: opportunity.originalDescription
          },
          jobAnalysis: opportunity.analysis
        }
      }),
      fallback
    );

    let output: CareerDocumentOutput;
    try {
      output = validateAiOutput<CareerDocumentOutput>(careerDocumentPackSchema, generated.output);
      validateFitEvidence(output, candidateProfile, fallback.fitMatrix.map((item) => item.requirement));
    } catch {
      throw new BadGatewayException("AI returned an invalid or unsupported career document pack");
    }

    return this.prisma.careerDocument.upsert({
      where: { opportunityId_language: { opportunityId, language } },
      create: {
        userId,
        opportunityId,
        language,
        candidateProfile,
        cvMarkdown: output.cvMarkdown,
        coverLetter: output.coverLetter,
        fitMatrix: output.fitMatrix,
        providerName: generated.providerName,
        modelName: generated.modelName,
        promptTemplateVersion: generated.promptTemplateVersion
      },
      update: {
        candidateProfile,
        cvMarkdown: output.cvMarkdown,
        coverLetter: output.coverLetter,
        fitMatrix: output.fitMatrix,
        providerName: generated.providerName,
        modelName: generated.modelName,
        promptTemplateVersion: generated.promptTemplateVersion
      },
      include: documentInclude
    });
  }

  async remove(userId: string, documentId: string) {
    await this.get(userId, documentId);
    await this.prisma.careerDocument.delete({ where: { id: documentId } });
  }
}

function buildDeterministicDocumentPack(
  opportunity: {
    title: string;
    company: string;
    originalDescription: string;
    analysis: null | { requiredRequirements: unknown; preferredRequirements: unknown };
  },
  language: CareerDocumentLanguage,
  candidateProfile: string
): CareerDocumentOutput {
  const requirements = collectRequirements(opportunity);
  const fitMatrix = requirements.map((requirement) => evaluateRequirement(requirement, candidateProfile, language));
  const aligned = fitMatrix.filter((item) => item.status !== "gap").map((item) => item.requirement);
  const cvMarkdown = language === "pt-BR"
    ? [
      `# Curriculo profissional direcionado - ${opportunity.title}`,
      "",
      `**Empresa-alvo:** ${opportunity.company}`,
      "",
      "## Perfil e evidencias fornecidas",
      "",
      candidateProfile,
      "",
      "## Foco de aderencia",
      "",
      ...(aligned.length ? aligned.map((item) => `- Evidencia relacionada a: ${item}`) : ["- Nenhum requisito possui evidencia explicita suficiente; revise as lacunas abaixo."])
    ].join("\n")
    : [
      `# Tailored professional CV - ${opportunity.title}`,
      "",
      `**Target company:** ${opportunity.company}`,
      "",
      "## Supplied profile and evidence",
      "",
      candidateProfile,
      "",
      "## Alignment focus",
      "",
      ...(aligned.length ? aligned.map((item) => `- Related evidence for: ${item}`) : ["- No requirement has enough explicit evidence; review the gaps below."])
    ].join("\n");
  const supportedCount = fitMatrix.filter((item) => item.status === "supported").length;
  const partialCount = fitMatrix.filter((item) => item.status === "partial").length;
  const coverLetter = language === "pt-BR"
    ? [
      `Prezada equipe de recrutamento da ${opportunity.company},`,
      "",
      `Apresento minha candidatura para a posicao de ${opportunity.title}. Para manter este rascunho fiel, utilizo somente as evidencias profissionais fornecidas abaixo:`,
      "",
      candidateProfile,
      "",
      `A comparacao conservadora encontrou ${supportedCount} requisito(s) com evidencia explicita e ${partialCount} com evidencia parcial. Estou disponivel para detalhar essas experiencias e esclarecer as lacunas identificadas.`,
      "",
      "Atenciosamente"
    ].join("\n")
    : [
      `Dear ${opportunity.company} hiring team,`,
      "",
      `I am applying for the ${opportunity.title} position. To keep this draft accurate, it uses only the professional evidence supplied below:`,
      "",
      candidateProfile,
      "",
      `The conservative comparison found ${supportedCount} requirement(s) with explicit evidence and ${partialCount} with partial evidence. I would welcome the opportunity to discuss this experience and clarify the identified gaps.`,
      "",
      "Sincerely"
    ].join("\n");

  return { cvMarkdown, coverLetter, fitMatrix, unsupportedClaims: [] };
}

function collectRequirements(opportunity: {
  originalDescription: string;
  analysis: null | { requiredRequirements: unknown; preferredRequirements: unknown };
}) {
  const analyzed = [
    ...stringArray(opportunity.analysis?.requiredRequirements),
    ...stringArray(opportunity.analysis?.preferredRequirements)
  ];
  if (analyzed.length) return [...new Set(analyzed)].slice(0, 20);
  return [...new Set(opportunity.originalDescription
    .split(/\r?\n|(?<=[.!?])\s+/)
    .map((item) => item.replace(/^[-*•]\s*/, "").trim())
    .filter((item) => item.length >= 10))].slice(0, 12);
}

function evaluateRequirement(requirement: string, candidateProfile: string, language: CareerDocumentLanguage) {
  const profile = normalize(candidateProfile);
  const normalizedRequirement = normalize(requirement);
  const tokens = significantTokens(normalizedRequirement);
  const matches = tokens.filter((token) => profile.includes(token));
  const exact = normalizedRequirement.length >= 4 && profile.includes(normalizedRequirement);
  const partial = !exact && matches.length >= Math.max(1, Math.ceil(tokens.length * 0.5));
  const status = exact ? "supported" : partial ? "partial" : "gap";
  const evidence = status === "supported"
    ? language === "pt-BR" ? `Correspondencia explicita no perfil: ${requirement}` : `Explicit profile match: ${requirement}`
    : status === "partial"
      ? language === "pt-BR" ? `Termos relacionados encontrados: ${matches.join(", ")}` : `Related terms found: ${matches.join(", ")}`
      : language === "pt-BR" ? "Nenhuma evidencia explicita fornecida." : "No explicit evidence was supplied.";
  return { requirement, evidence, status } as CareerDocumentOutput["fitMatrix"][number];
}

function validateFitEvidence(output: CareerDocumentOutput, candidateProfile: string, expectedRequirements: string[]) {
  const profile = normalize(candidateProfile);
  const expected = new Set(expectedRequirements.map(normalize));
  const received = new Set(output.fitMatrix.map((item) => normalize(item.requirement)));
  if (expected.size !== received.size || [...expected].some((requirement) => !received.has(requirement))) {
    throw new Error("Fit matrix does not cover the vacancy requirements");
  }
  for (const item of output.fitMatrix) {
    if (item.status === "gap") continue;
    const evidenceTokens = significantTokens(normalize(item.evidence));
    if (!evidenceTokens.some((token) => profile.includes(token))) {
      throw new Error("Fit evidence is not grounded in the supplied profile");
    }
  }
}

function significantTokens(value: string) {
  const ignored = new Set(["with", "from", "that", "this", "para", "como", "com", "uma", "por", "the", "and", "experience", "experiencia"]);
  return [...new Set(value.split(/[^a-z0-9+#.]+/).filter((token) => token.length >= 3 && !ignored.has(token)))];
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function validLanguage(value: unknown): CareerDocumentLanguage {
  if (value !== "pt-BR" && value !== "en") throw new BadRequestException("language must be pt-BR or en");
  return value;
}

function requiredText(value: unknown, field: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim()) throw new BadRequestException(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new BadRequestException(`${field} is too long`);
  return normalized;
}
