import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CompetencyEvaluation, JobAnalysis, JobOpportunity } from "../../../lib/types";
import { buildJobQuery, CompetencyEvaluationPanel, JobAnalysisPanel, JobOpportunityCard, JobOpportunityDetail } from "./jobs-view";

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
});
