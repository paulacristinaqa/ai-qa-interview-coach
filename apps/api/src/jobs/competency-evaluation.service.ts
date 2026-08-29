import { BadGatewayException, BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AiGateway } from "../ai/ai-gateway.service";
import { competencyEvaluationSchema, validateAiOutput } from "../ai/ai-output-schemas";
import { createPromptRequest } from "../ai/prompts/prompt-template.registry";
import { PrismaService } from "../database/prisma.service";
import { CompetencyCategory, CompetencyEvaluationOutput, EvaluateCompetenciesRequest, RequirementImportance } from "./competency-evaluation.types";

interface EvidenceRecord {
  id: string;
  type: string;
  title: string;
  description: string;
  skills: unknown;
  outcome: string | null;
}

interface ExpectedRequirement {
  id: string;
  text: string;
  category: CompetencyCategory;
  importance: RequirementImportance;
}

@Injectable()
export class CompetencyEvaluationService {
  constructor(private readonly prisma: PrismaService, private readonly ai: AiGateway) {}

  async evaluate(userId: string, opportunityId: string, request: EvaluateCompetenciesRequest) {
    const evidenceIds = validEvidenceIds(request.evidenceIds);
    const [opportunity, unorderedEvidence] = await Promise.all([
      this.prisma.jobOpportunity.findFirst({ where: { id: opportunityId, userId }, include: { analysis: true } }),
      this.prisma.professionalEvidence.findMany({ where: { userId, id: { in: evidenceIds } } })
    ]);
    if (!opportunity) throw new NotFoundException("Job opportunity not found");
    if (!opportunity.analysis) throw new BadRequestException("Analyze the job before evaluating competencies");
    if (unorderedEvidence.length !== evidenceIds.length) throw new BadRequestException("Every evidence item must belong to the authenticated user");

    const evidenceById = new Map(unorderedEvidence.map((item) => [item.id, item]));
    const evidence = evidenceIds.map((id) => evidenceById.get(id)!);
    const expected = expectedRequirements(opportunity.analysis.requiredRequirements, opportunity.analysis.preferredRequirements);
    if (!expected.length) throw new BadRequestException("The job analysis does not contain requirements to evaluate");

    const language = resolveLanguage(opportunity.language);
    const fallback = buildDeterministicEvaluation(expected, evidence, language);
    const generated = await this.ai.generate<CompetencyEvaluationOutput>(
      createPromptRequest("career.competency-evaluation", {
        language,
        userInput: opportunity.originalDescription,
        context: {
          jobOpportunity: { id: opportunity.id, title: opportunity.title, company: opportunity.company },
          jobAnalysis: {
            updatedAt: opportunity.analysis.updatedAt,
            requiredRequirements: opportunity.analysis.requiredRequirements,
            preferredRequirements: opportunity.analysis.preferredRequirements
          },
          evidenceCatalog: evidence.map((item) => ({ id: item.id, type: item.type, title: item.title, description: item.description, skills: item.skills, outcome: item.outcome }))
        }
      }),
      fallback
    );

    let output: CompetencyEvaluationOutput;
    try {
      output = validateAiOutput<CompetencyEvaluationOutput>(competencyEvaluationSchema, generated.output);
      validateEvaluation(output, expected, evidence);
    } catch {
      throw new BadGatewayException("AI returned an invalid or ungrounded competency evaluation");
    }

    return this.prisma.competencyEvaluation.upsert({
      where: { opportunityId },
      create: {
        userId,
        opportunityId,
        summary: output.summary,
        overallScore: output.overallScore,
        requirements: output.requirements,
        evidenceIds,
        analysisUpdatedAt: opportunity.analysis.updatedAt,
        providerName: generated.providerName,
        modelName: generated.modelName,
        promptTemplateVersion: generated.promptTemplateVersion
      },
      update: {
        summary: output.summary,
        overallScore: output.overallScore,
        requirements: output.requirements,
        evidenceIds,
        analysisUpdatedAt: opportunity.analysis.updatedAt,
        providerName: generated.providerName,
        modelName: generated.modelName,
        promptTemplateVersion: generated.promptTemplateVersion
      }
    });
  }
}

function expectedRequirements(requiredValue: unknown, preferredValue: unknown): ExpectedRequirement[] {
  const required = stringArray(requiredValue).map((text, index) => requirement(`required-${index + 1}`, text, "required"));
  const preferred = stringArray(preferredValue).map((text, index) => requirement(`preferred-${index + 1}`, text, "preferred"));
  return [...required, ...preferred];
}

function requirement(id: string, text: string, importance: RequirementImportance): ExpectedRequirement {
  return { id, text, importance, category: inferCategory(text) };
}

function buildDeterministicEvaluation(expected: ExpectedRequirement[], evidence: EvidenceRecord[], language: "pt-BR" | "en"): CompetencyEvaluationOutput {
  const requirements = expected.map((item) => {
    const matches = evidence.map((record) => ({ record, ratio: matchRatio(item.text, record) })).filter((match) => match.ratio >= 0.35);
    const strongest = matches.reduce((maximum, match) => Math.max(maximum, match.ratio), 0);
    const status = strongest >= 0.75 ? "supported" : matches.length ? "partial" : "gap";
    const citedIds = status === "gap" ? [] : matches.map((match) => match.record.id);
    return {
      ...item,
      status,
      confidence: status === "supported" ? 0.9 : status === "partial" ? 0.65 : 0.85,
      evidenceIds: citedIds,
      rationale: language === "pt-BR"
        ? status === "gap" ? "Nenhuma evidencia selecionada sustenta este requisito." : `Correspondencia conservadora em ${citedIds.length} evidencia(s) selecionada(s).`
        : status === "gap" ? "No selected evidence supports this requirement." : `Conservative match in ${citedIds.length} selected evidence item(s).`,
      documentGuidance: language === "pt-BR"
        ? status === "gap" ? "Nao declarar esta competencia; preparar uma evidencia real." : "Citar somente as evidencias identificadas e seus resultados comprovaveis."
        : status === "gap" ? "Do not claim this competency; prepare real evidence." : "Use only the identified evidence and its demonstrable outcomes."
    } as CompetencyEvaluationOutput["requirements"][number];
  });
  const overallScore = calculateScore(requirements);
  const supported = requirements.filter((item) => item.status === "supported").length;
  const partial = requirements.filter((item) => item.status === "partial").length;
  const gaps = requirements.filter((item) => item.status === "gap").length;
  const summary = language === "pt-BR"
    ? `${supported} requisito(s) sustentado(s), ${partial} parcial(is) e ${gaps} lacuna(s), com base apenas nas evidencias selecionadas.`
    : `${supported} supported requirement(s), ${partial} partial match(es), and ${gaps} gap(s), based only on selected evidence.`;
  return { summary, overallScore, requirements };
}

function validateEvaluation(output: CompetencyEvaluationOutput, expected: ExpectedRequirement[], evidence: EvidenceRecord[]) {
  if (output.requirements.length !== expected.length) throw new Error("Incomplete requirement coverage");
  const expectedById = new Map(expected.map((item) => [item.id, item]));
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  const receivedIds = new Set(output.requirements.map((item) => item.id));
  if (receivedIds.size !== expected.length || expected.some((item) => !receivedIds.has(item.id))) throw new Error("Duplicate or missing requirement IDs");
  for (const item of output.requirements) {
    const source = expectedById.get(item.id);
    if (!source || item.text !== source.text || item.importance !== source.importance || item.category !== source.category) {
      throw new Error("Requirement identity mismatch");
    }
    if (item.status === "gap" && item.evidenceIds.length) throw new Error("Gap cannot cite evidence");
    if (item.status !== "gap" && !item.evidenceIds.length) throw new Error("Positive match requires evidence");
    if (item.evidenceIds.some((id) => !evidenceById.has(id))) throw new Error("Unknown evidence ID");
    const ratios = item.evidenceIds.map((id) => matchRatio(item.text, evidenceById.get(id)!));
    if (ratios.some((ratio) => ratio < 0.35)) throw new Error("Ungrounded evidence citation");
    if (item.status === "supported" && Math.max(0, ...ratios) < 0.75) throw new Error("Supported status is not sufficiently grounded");
  }
  if (Math.abs(output.overallScore - calculateScore(output.requirements)) > 0.5) throw new Error("Inflated overall score");
}

function calculateScore(requirements: CompetencyEvaluationOutput["requirements"]) {
  let achieved = 0;
  let total = 0;
  for (const item of requirements) {
    const weight = item.importance === "required" ? 2 : 1;
    total += weight;
    achieved += weight * (item.status === "supported" ? 1 : item.status === "partial" ? 0.5 : 0);
  }
  return total ? Math.round((achieved / total) * 100) : 0;
}

function matchRatio(requirement: string, evidence: EvidenceRecord) {
  const requirementTokens = significantTokens(normalize(requirement));
  const evidenceText = normalize([evidence.title, evidence.description, ...stringArray(evidence.skills), evidence.outcome ?? ""].join(" "));
  if (!requirementTokens.length) return 0;
  const matches = requirementTokens.filter((token) => evidenceText.includes(token)).length;
  return matches / requirementTokens.length;
}

function inferCategory(value: string): CompetencyCategory {
  if (/certif|istqb|certificate/i.test(value)) return "certification";
  if (/degree|education|bachelor|master|formacao|gradua/i.test(value)) return "education";
  if (/english|portuguese|language|idioma|ingles/i.test(value)) return "language";
  if (/communication|collaboration|leadership|ownership|comunica|colabora|lider/i.test(value)) return "soft_skill";
  if (/experience|years|anos|experi[eê]ncia/i.test(value)) return "experience";
  if (/sql|api|test|playwright|cypress|selenium|docker|javascript|typescript|java|python|aws|azure|git/i.test(value)) return "technical";
  return "other";
}

function validEvidenceIds(value: unknown) {
  if (!Array.isArray(value) || !value.length || value.some((id) => typeof id !== "string" || !id.trim())) {
    throw new BadRequestException("Select at least one professional evidence item");
  }
  const ids = [...new Set(value.map((id) => id.trim()))];
  if (ids.length > 30) throw new BadRequestException("No more than 30 evidence items can be evaluated");
  return ids;
}

function significantTokens(value: string) {
  const ignored = new Set(["required", "preferred", "must", "with", "from", "that", "this", "para", "como", "com", "uma", "por", "the", "and", "experience", "experiencia"]);
  return [...new Set(value.split(/[^a-z0-9+#.]+/).filter((token) => token.length >= 3 && !ignored.has(token)))];
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function resolveLanguage(language: string): "pt-BR" | "en" {
  return /^(pt|portugu)/i.test(language.trim()) ? "pt-BR" : "en";
}
