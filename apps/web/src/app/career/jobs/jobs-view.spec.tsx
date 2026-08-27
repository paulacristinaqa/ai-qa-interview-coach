import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { JobAnalysis, JobOpportunity } from "../../../lib/types";
import { buildJobQuery, JobAnalysisPanel, JobOpportunityCard, JobOpportunityDetail } from "./jobs-view";

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

describe("Job Intelligence frontend", () => {
  it("renders opportunity summary and detail", () => {
    const markup = renderToStaticMarkup(<><JobOpportunityCard job={job} /><JobOpportunityDetail job={job} /></>);
    expect(markup).toContain("Senior QA Engineer");
    expect(markup).toContain("Em entrevistas");
    expect(markup).toContain("Descricao original");
    expect(markup).toContain("Abrir anuncio original");
    expect(markup).toContain('/grill-me?opportunityId=job-1');
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
});
