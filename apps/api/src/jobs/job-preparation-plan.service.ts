import { BadGatewayException, BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { jobPreparationPlanSchema, validateAiOutput } from "../ai/ai-output-schemas";
import { AiGateway } from "../ai/ai-gateway.service";
import { createPromptRequest } from "../ai/prompts/prompt-template.registry";
import { PrismaService } from "../database/prisma.service";
import { CompetencyCategory, CompetencyEvaluationOutput, RequirementImportance } from "./competency-evaluation.types";
import {
  DocumentAction,
  JobPreparationPlanOutput,
  PreparationPriority,
  PreparationSourceRequirement,
  RecommendedPreparationResource,
  RecommendedModule
} from "./job-preparation-plan.types";

@Injectable()
export class JobPreparationPlanService {
  constructor(private readonly prisma: PrismaService, private readonly ai: AiGateway) {}

  async generate(userId: string, opportunityId: string) {
    const opportunity = await this.prisma.jobOpportunity.findFirst({ where: { id: opportunityId, userId }, include: { analysis: true, competencyEvaluation: true } });
    if (!opportunity) throw new NotFoundException("Job opportunity not found");
    if (!opportunity.analysis || !opportunity.competencyEvaluation) {
      throw new BadRequestException("Evaluate competencies before generating a preparation plan");
    }
    if (opportunity.competencyEvaluation.analysisUpdatedAt.getTime() !== opportunity.analysis.updatedAt.getTime()) {
      throw new BadRequestException("Evaluate competencies again because the job analysis changed");
    }

    const sources = parseSources(opportunity.competencyEvaluation.requirements);
    const language = resolveLanguage(opportunity.language);
    const [questions, challenges] = await Promise.all([
      this.prisma.question.findMany({
        where: { language },
        select: { id: true, topic: true, competency: true, prompt: true, level: true },
        orderBy: [{ level: "asc" }, { createdAt: "asc" }]
      }),
      this.prisma.technicalChallenge.findMany({
        select: { id: true, area: true, title: true, difficulty: true, context: true, evaluationCriteria: true },
        orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }]
      })
    ]);
    const fallback = buildDeterministicPlan(sources, language);
    const generated = await this.ai.generate<JobPreparationPlanOutput>(
      createPromptRequest("career.preparation-plan", {
        language,
        userInput: opportunity.originalDescription,
        context: {
          jobOpportunity: { id: opportunity.id, title: opportunity.title, company: opportunity.company },
          competencyEvaluation: {
            id: opportunity.competencyEvaluation.id,
            updatedAt: opportunity.competencyEvaluation.updatedAt,
            overallScore: opportunity.competencyEvaluation.overallScore,
            requirements: sources
          }
        }
      }),
      fallback
    );

    let output: JobPreparationPlanOutput;
    try {
      output = validateAiOutput<JobPreparationPlanOutput>(jobPreparationPlanSchema, generated.output);
      validatePlan(output, sources);
    } catch {
      throw new BadGatewayException("AI returned an invalid or ungrounded preparation plan");
    }
    const items = attachCatalogResources(output.items, questions, challenges, language) as unknown as Prisma.InputJsonValue;

    return this.prisma.jobPreparationPlan.upsert({
      where: { opportunityId },
      create: {
        userId,
        opportunityId,
        summary: output.summary,
        items,
        evaluationUpdatedAt: opportunity.competencyEvaluation.updatedAt,
        providerName: generated.providerName,
        modelName: generated.modelName,
        promptTemplateVersion: generated.promptTemplateVersion
      },
      update: {
        summary: output.summary,
        items,
        evaluationUpdatedAt: opportunity.competencyEvaluation.updatedAt,
        providerName: generated.providerName,
        modelName: generated.modelName,
        promptTemplateVersion: generated.promptTemplateVersion
      }
    });
  }
}

interface QuestionResource {
  id: string;
  topic: string;
  competency: string;
  prompt: string;
  level: number;
}

interface ChallengeResource {
  id: string;
  area: string;
  title: string;
  difficulty: string;
  context: string;
  evaluationCriteria: unknown;
}

function attachCatalogResources(
  items: JobPreparationPlanOutput["items"],
  questions: QuestionResource[],
  challenges: ChallengeResource[],
  language: "pt-BR" | "en"
) {
  return items.map((item) => ({
    ...item,
    recommendedResource: selectResource(item.requirement, item.recommendedModule, questions, challenges, language)
  }));
}

function selectResource(
  requirement: string,
  module: RecommendedModule,
  questions: QuestionResource[],
  challenges: ChallengeResource[],
  language: "pt-BR" | "en"
): RecommendedPreparationResource | null {
  if (module === "evidence-library") return null;
  if (module === "grill-me") {
    const question = bestMatch(requirement, questions, (item) => `${item.topic} ${item.competency} ${item.prompt}`)
      ?? questions[0];
    return question ? {
      type: "question",
      id: question.id,
      title: question.prompt,
      detail: `${question.topic} · level ${question.level}`,
      topic: question.topic,
      language,
      level: question.level
    } : null;
  }
  const inferredArea = inferTechnicalArea(requirement);
  const areaChallenges = challenges.filter((item) => item.area.toLowerCase() === inferredArea.toLowerCase());
  const challenge = bestMatch(requirement, areaChallenges.length ? areaChallenges : challenges, (item) =>
    `${item.area} ${item.title} ${item.context} ${stringArray(item.evaluationCriteria).join(" ")}`
  ) ?? areaChallenges[0] ?? challenges[0];
  return challenge ? {
    type: "challenge",
    id: challenge.id,
    title: challenge.title,
    detail: `${challenge.area} · ${challenge.difficulty}`
  } : null;
}

function bestMatch<T>(requirement: string, catalog: T[], text: (item: T) => string): T | undefined {
  const requirementTokens = tokens(requirement);
  let selected: { item: T; score: number } | undefined;
  for (const item of catalog) {
    const candidateTokens = new Set(tokens(text(item)));
    const score = requirementTokens.reduce((total, token) => total + (candidateTokens.has(token) ? 1 : 0), 0);
    if (!selected || score > selected.score) selected = { item, score };
  }
  return selected?.item;
}

function tokens(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
}

function inferTechnicalArea(requirement: string) {
  const normalized = requirement.toLowerCase();
  if (/\bsql\b|database|banco de dados/.test(normalized)) return "SQL";
  if (/\bapi\b|rest|postman|contract/.test(normalized)) return "API";
  if (/playwright|cypress|selenium|automat|docker|ci\/cd|pipeline/.test(normalized)) return "Automation";
  return "Test Design";
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseSources(value: unknown): PreparationSourceRequirement[] {
  if (!Array.isArray(value)) throw new BadRequestException("Competency evaluation requirements are invalid");
  const parsed = value.map((item) => parseSource(item)).filter((item): item is PreparationSourceRequirement => item !== null);
  return parsed.sort((left, right) => priorityRank(priorityFor(left)) - priorityRank(priorityFor(right)));
}

function parseSource(value: unknown): PreparationSourceRequirement | null {
  if (!value || typeof value !== "object") throw new BadRequestException("Competency evaluation requirements are invalid");
  const item = value as Partial<CompetencyEvaluationOutput["requirements"][number]>;
  if (item.status === "supported") return null;
  if (
    typeof item.id !== "string" || !item.id || typeof item.text !== "string" || !item.text ||
    !isCategory(item.category) || !isImportance(item.importance) || !["partial", "gap"].includes(item.status ?? "")
  ) throw new BadRequestException("Competency evaluation requirements are invalid");
  return { id: item.id, text: item.text, category: item.category, importance: item.importance, status: item.status as "partial" | "gap" };
}

function buildDeterministicPlan(sources: PreparationSourceRequirement[], language: "pt-BR" | "en"): JobPreparationPlanOutput {
  const pt = language === "pt-BR";
  return {
    summary: sources.length
      ? pt
        ? `${sources.length} requisito(s) priorizado(s) a partir de lacunas e evidencias parciais validadas.`
        : `${sources.length} requirement(s) prioritized from validated gaps and partial evidence.`
      : pt
        ? "Nenhuma lacuna ou evidencia parcial exige preparacao adicional nesta avaliacao."
        : "No gaps or partial evidence require additional preparation in this evaluation.",
    items: sources.map((source) => ({
      requirementId: source.id,
      requirement: source.text,
      sourceStatus: source.status,
      priority: priorityFor(source),
      objective: source.status === "gap"
        ? pt ? `Construir evidencia verificavel para ${source.text}.` : `Build verifiable evidence for ${source.text}.`
        : pt ? `Fortalecer a evidencia existente para ${source.text}.` : `Strengthen the existing evidence for ${source.text}.`,
      actions: actionsFor(source, pt),
      successCriteria: successCriteriaFor(source, pt),
      recommendedModule: moduleFor(source.category),
      documentAction: documentActionFor(source.status)
    }))
  };
}

function actionsFor(source: PreparationSourceRequirement, pt: boolean) {
  if (source.status === "gap") return pt
    ? [`Revisar os fundamentos de ${source.text}.`, `Praticar ${source.text} em um cenario pequeno e observavel.`, "Registrar o resultado real na Biblioteca de Evidencias."]
    : [`Review the fundamentals of ${source.text}.`, `Practice ${source.text} in a small observable scenario.`, "Record the real result in the Evidence Library."];
  return pt
    ? [`Revisar a evidencia parcial ligada a ${source.text}.`, "Adicionar contexto, acao, resultado e limitacoes verificaveis.", "Treinar uma explicacao curta sem ampliar os fatos registrados."]
    : [`Review the partial evidence linked to ${source.text}.`, "Add verifiable context, action, outcome and limitations.", "Practice a concise explanation without expanding the recorded facts."];
}

function successCriteriaFor(source: PreparationSourceRequirement, pt: boolean) {
  const practical = source.category === "technical"
    ? pt ? "Concluir um exercicio reproduzivel e guardar sua evidencia." : "Complete a reproducible exercise and retain its evidence."
    : pt ? "Explicar um exemplo real com contexto, acao e resultado." : "Explain a real example with context, action and outcome.";
  return [
    practical,
    pt ? "Registrar somente fatos que possam ser defendidos em entrevista." : "Record only facts that can be defended in an interview."
  ];
}

function priorityFor(source: PreparationSourceRequirement): PreparationPriority {
  if (source.importance === "required" && source.status === "gap") return "high";
  if (source.importance === "required" || source.status === "gap") return "medium";
  return "low";
}

function moduleFor(category: CompetencyCategory): RecommendedModule {
  if (category === "technical") return "technical-lab";
  if (["experience", "language", "soft_skill"].includes(category)) return "grill-me";
  return "evidence-library";
}

function documentActionFor(status: PreparationSourceRequirement["status"]): DocumentAction {
  return status === "gap" ? "omit-until-evidenced" : "strengthen-evidence";
}

function validatePlan(output: JobPreparationPlanOutput, sources: PreparationSourceRequirement[]) {
  if (output.items.length !== sources.length) throw new Error("Plan must cover every partial match and gap");
  const seen = new Set<string>();
  output.items.forEach((item, index) => {
    const source = sources[index];
    if (seen.has(item.requirementId)) throw new Error("Duplicate requirement");
    seen.add(item.requirementId);
    if (
      item.requirementId !== source.id || item.requirement !== source.text || item.sourceStatus !== source.status ||
      item.priority !== priorityFor(source) || item.recommendedModule !== moduleFor(source.category) ||
      item.documentAction !== documentActionFor(source.status)
    ) throw new Error("Plan item does not match its validated requirement");
  });
}

function priorityRank(priority: PreparationPriority) {
  return { high: 0, medium: 1, low: 2 }[priority];
}

function resolveLanguage(language: string): "pt-BR" | "en" {
  return language.toLowerCase().startsWith("pt") || language.toLowerCase().includes("portugu") ? "pt-BR" : "en";
}

function isCategory(value: unknown): value is CompetencyCategory {
  return typeof value === "string" && ["technical", "experience", "education", "certification", "language", "soft_skill", "other"].includes(value);
}

function isImportance(value: unknown): value is RequirementImportance {
  return value === "required" || value === "preferred";
}
