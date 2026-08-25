import { BadGatewayException, Injectable } from "@nestjs/common";
import { AiGateway } from "../ai/ai-gateway.service";
import { jobAnalysisSchema, validateAiOutput } from "../ai/ai-output-schemas";
import { createPromptRequest } from "../ai/prompts/prompt-template.registry";
import { PrismaService } from "../database/prisma.service";
import { JobAnalysisOutput } from "./job-analysis.types";
import { JobsService } from "./jobs.service";

@Injectable()
export class JobAnalysisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
    private readonly ai: AiGateway
  ) {}

  async analyze(userId: string, opportunityId: string) {
    const opportunity = await this.jobsService.get(userId, opportunityId);
    const candidateEvidence = await this.getCandidateEvidence(userId);
    const fallback = buildDeterministicAnalysis(opportunity, candidateEvidence.criScore);
    const generated = await this.ai.generate<JobAnalysisOutput>(
      createPromptRequest("career.job-analysis", {
        language: resolveLanguage(opportunity.language),
        userInput: opportunity.originalDescription,
        context: {
          jobOpportunity: {
            title: opportunity.title,
            company: opportunity.company,
            country: opportunity.country,
            city: opportunity.city,
            workModel: opportunity.workModel,
            statedSeniority: opportunity.seniority,
            language: opportunity.language
          },
          candidateEvidence
        }
      }),
      fallback
    );

    let output: JobAnalysisOutput;
    try {
      output = validateAiOutput<JobAnalysisOutput>(jobAnalysisSchema, generated.output);
    } catch {
      throw new BadGatewayException("AI returned an invalid structured job analysis");
    }

    return this.prisma.jobAnalysis.upsert({
      where: { opportunityId },
      create: {
        opportunityId,
        ...output,
        providerName: generated.providerName,
        modelName: generated.modelName,
        promptTemplateVersion: generated.promptTemplateVersion
      },
      update: {
        ...output,
        providerName: generated.providerName,
        modelName: generated.modelName,
        promptTemplateVersion: generated.promptTemplateVersion
      }
    });
  }

  private async getCandidateEvidence(userId: string) {
    const [cri, questionAttempts, technicalAttempts] = await Promise.all([
      this.prisma.criSnapshot.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
      this.prisma.questionAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { question: { select: { topic: true, competency: true } } }
      }),
      this.prisma.technicalAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { challenge: { select: { area: true, difficulty: true } } }
      })
    ]);
    return {
      criScore: cri?.score ?? null,
      criConfidence: cri?.confidenceLevel ?? "unavailable",
      demonstratedQuestionCompetencies: questionAttempts.map((attempt) => ({
        topic: attempt.question.topic,
        competency: attempt.question.competency,
        score: attempt.score
      })),
      completedTechnicalAreas: technicalAttempts.map((attempt) => ({
        area: attempt.challenge.area,
        difficulty: attempt.challenge.difficulty
      }))
    };
  }
}

function buildDeterministicAnalysis(
  opportunity: { originalDescription: string; seniority: string },
  criScore: number | null
): JobAnalysisOutput {
  const description = opportunity.originalDescription.trim();
  const statements = description
    .split(/\r?\n|(?<=[.!?])\s+/)
    .map((value) => value.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
  const responsibilities = matching(statements, /responsib|you will|own |lead |design |develop |test |ensure |garant|lider|desenvolv/i);
  const preferredRequirements = matching(statements, /preferred|nice to have|bonus|desej|diferencial|plus/i);
  const requiredRequirements = matching(statements, /required|must |experience|knowledge|proficien|requis|experi[eê]ncia|conhecimento/i)
    .filter((item) => !preferredRequirements.includes(item));
  const technologies = detectTerms(description, [
    "Playwright", "Cypress", "Selenium", "Postman", "REST", "GraphQL", "SQL", "JavaScript", "TypeScript",
    "Java", "Python", "C#", "Git", "Docker", "Kubernetes", "AWS", "Azure", "Jenkins", "GitHub Actions", "Jira"
  ]);
  const softSkills = detectTerms(description, [
    "communication", "collaboration", "leadership", "ownership", "problem solving",
    "comunicacao", "colaboracao", "lideranca", "autonomia"
  ]);
  const score = criScore === null ? 40 : Math.max(0, Math.min(100, Math.round(criScore)));
  const evidence = criScore === null
    ? ["No Career Readiness Index evidence is available; fit is conservative."]
    : [`Current Career Readiness Index: ${score}/100.`];
  const gaps = requiredRequirements.length
    ? requiredRequirements.slice(0, 5)
    : ["Confirm mandatory requirements against demonstrated profile evidence."];
  return {
    technicalSummary: description.slice(0, 700),
    responsibilities,
    requiredRequirements,
    preferredRequirements,
    technologies,
    softSkills,
    estimatedSeniority: opportunity.seniority,
    profileFit: {
      score,
      summary: criScore === null
        ? "Limited profile evidence is available for a confident comparison."
        : "Fit estimate uses the current Career Readiness Index and demonstrated practice evidence.",
      evidence
    },
    gaps,
    preparationPlan: gaps.slice(0, 4).map((gap, index) => ({
      priority: index === 0 ? "high" : index === 1 ? "medium" : "low",
      action: `Prepare evidence and a practical example for: ${gap}`,
      rationale: "The requirement is not yet supported by explicit evidence in the current profile."
    }))
  };
}

function matching(statements: string[], pattern: RegExp) {
  return [...new Set(statements.filter((statement) => pattern.test(statement)))].slice(0, 12);
}

function detectTerms(description: string, terms: string[]) {
  const normalized = description.toLocaleLowerCase();
  return terms.filter((term) => normalized.includes(term.toLocaleLowerCase()));
}

function resolveLanguage(language: string): "pt-BR" | "en" {
  return /^(pt|portugu)/i.test(language.trim()) ? "pt-BR" : "en";
}
