import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CompetencyEvaluation, JobAnalysis, JobOpportunity, JobPreparationPlan } from "../../../lib/types";
import { buildJobQuery, CompetencyEvaluationPanel, JobAnalysisPanel, JobOpportunityCard, JobOpportunityDetail, JobPreparationPlanPanel, PreparationPlanner } from "./jobs-view";

const job: JobOpportunity = {
  id: "job-1", title: "Senior QA Engineer", company: "Example Labs", country: "Portugal", city: "Lisboa",
  workModel: "hybrid", seniority: "Senior", language: "English", link: "https://example.com/job",
  originalDescription: "Own the quality strategy.", status: "interviewing", favorite: true, notes: "Prepare API examples.",
  createdAt: "2026-08-25T00:00:00.000Z", updatedAt: "2026-08-25T00:00:00.000Z"
};

const analysis: JobAnalysis = {
  id: "analysis-1",
  opportunityId: "job-1",
  technicalSummary: "API-focused QA role",
  responsibilities: ["Own API testing"],
  requiredRequirements: ["SQL"],
  preferredRequirements: ["Docker"],
  technologies: ["Playwright"],
  softSkills: ["communication"],
  estimatedSeniority: "Senior",
  profileFit: { score: 72, summary: "Good fit", evidence: ["CRI"] },
  gaps: ["Docker"],
  preparationPlan: [{ priority: "high", action: "Practice Docker", rationale: "Close the gap" }],
  providerName: "mock",
  modelName: "deterministic",
  promptTemplateVersion: "career.job-analysis@1.0.0",
  createdAt: "2026-08-25T00:00:00.000Z",
  updatedAt: "2026-08-25T00:00:00.000Z"
};

const competencyEvaluation: CompetencyEvaluation = {
  id: "evaluation-1",
  opportunityId: "job-1",
  summary: "One supported requirement and one gap.",
  overallScore: 67,
  requirements: [
    { id: "required-1", text: "API Testing", category: "technical", importance: "required", status: "supported", confidence: 0.9, evidenceIds: ["evidence-1"], rationale: "Matched project evidence.", documentGuidance: "Use the project outcome." },
    { id: "preferred-1", text: "Docker", category: "technical", importance: "preferred", status: "gap", confidence: 0.85, evidenceIds: [], rationale: "No selected evidence.", documentGuidance: "Do not claim Docker." }
  ],
  evidenceIds: ["evidence-1"],
  analysisUpdatedAt: analysis.updatedAt,
  providerName: "mock",
  modelName: "deterministic",
  promptTemplateVersion: "career.competency-evaluation@1.0.0",
  createdAt: "2026-08-29T00:00:00.000Z",
  updatedAt: "2026-08-29T00:00:00.000Z"
};

const preparationPlan: JobPreparationPlan = {
  id: "plan-1",
  opportunityId: "job-1",
  summary: "One prioritized gap.",
  items: [{
    requirementId: "preferred-1",
    requirement: "Docker",
    sourceStatus: "gap",
    priority: "medium",
    objective: "Build verifiable evidence for Docker.",
    actions: ["Practice Docker in a small observable scenario.", "Record the result in the Evidence Library."],
    successCriteria: ["Complete a reproducible exercise."],
    recommendedModule: "technical-lab",
    documentAction: "omit-until-evidenced",
    recommendedResource: { type: "challenge", id: "challenge-1", title: "Docker automation scenario", detail: "Automation · basic" }
  }],
  evaluationUpdatedAt: competencyEvaluation.updatedAt,
  providerName: "mock",
  modelName: "deterministic",
  promptTemplateVersion: "career.preparation-plan@1.0.0",
  createdAt: "2026-08-29T10:00:00.000Z",
  updatedAt: "2026-08-29T10:00:00.000Z"
};

describe("Job Intelligence frontend", () => {
  it("renders opportunity summary and detail", () => {
    const markup = renderToStaticMarkup(<><JobOpportunityCard job={job} /><JobOpportunityDetail job={job} /></>);
    expect(markup).toContain("Senior QA Engineer");
    expect(markup).toContain("Em entrevistas");
    expect(markup).toContain("Descricao original");
    expect(markup).toContain("Abrir anuncio original");
    expect(markup).toContain('/grill-me?opportunityId=job-1');
    expect(markup).toContain('/career/documents?opportunityId=job-1');
  });

  it("builds only active list filters", () => {
    expect(buildJobQuery({ search: "api", status: "saved", workModel: "remote", seniority: "", favorite: "true" }))
      .toBe("search=api&status=saved&workModel=remote&favorite=true");
  });

  it("renders the persisted structured analysis and preparation plan", () => {
    const markup = renderToStaticMarkup(<JobAnalysisPanel analysis={analysis} />);

    expect(markup).toContain("Aderencia 72%");
    expect(markup).toContain("Requisitos obrigatorios");
    expect(markup).toContain("Practice Docker");
    expect(markup).toContain("career.job-analysis@1.0.0");
  });

  it("renders a traceable competency matrix with gaps", () => {
    const markup = renderToStaticMarkup(<CompetencyEvaluationPanel evaluation={competencyEvaluation} />);

    expect(markup).toContain("67");
    expect(markup).toContain("API Testing");
    expect(markup).toContain("evidence-1");
    expect(markup).toContain("Comprovado");
    expect(markup).toContain("Lacuna");
    expect(markup).toContain("career.competency-evaluation@1.0.0");
  });

  it("renders the ordered preparation plan with module and document guidance", () => {
    const markup = renderToStaticMarkup(<JobPreparationPlanPanel plan={preparationPlan} opportunityId="job-1" />);

    expect(markup).toContain("One prioritized gap");
    expect(markup).toContain("Prioridade média");
    expect(markup).toContain("Practice Docker");
    expect(markup).toContain("Docker automation scenario");
    expect(markup).toContain('href="/technical-lab?challengeId=challenge-1"');
    expect(markup).toContain("não declarar até existir evidência");
    expect(markup).toContain("career.preparation-plan@1.0.0");
  });

  it("links a recommended catalog question to the vacancy-specific Grill Me", () => {
    const questionPlan: JobPreparationPlan = {
      ...preparationPlan,
      items: [{
        ...preparationPlan.items[0],
        recommendedModule: "grill-me",
        recommendedResource: { type: "question", id: "question-1", title: "Explain a quality decision", detail: "Behavioral · level 2", topic: "Behavioral", language: "en", level: 2 }
      }]
    };
    const markup = renderToStaticMarkup(<JobPreparationPlanPanel plan={questionPlan} opportunityId="job-1" />);

    expect(markup).toContain("Explain a quality decision");
    expect(markup).toContain('href="/grill-me?opportunityId=job-1&amp;questionId=question-1"');
  });

  it("marks a persisted plan as stale after a new competency evaluation", () => {
    const staleJob = {
      ...job,
      analysis,
      competencyEvaluation: { ...competencyEvaluation, updatedAt: "2026-08-29T11:00:00.000Z" },
      preparationPlan
    };
    const markup = renderToStaticMarkup(<PreparationPlanner job={staleJob} />);

    expect(markup).toContain("Plano desatualizado");
  });
});
