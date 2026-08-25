import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { JobOpportunity } from "../../../lib/types";
import { buildJobQuery, JobOpportunityCard, JobOpportunityDetail } from "./jobs-view";

const job: JobOpportunity = {
  id: "job-1", title: "Senior QA Engineer", company: "Example Labs", country: "Portugal", city: "Lisboa",
  workModel: "hybrid", seniority: "Senior", language: "English", link: "https://example.com/job",
  originalDescription: "Own the quality strategy.", status: "interviewing", favorite: true, notes: "Prepare API examples.",
  createdAt: "2026-08-25T00:00:00.000Z", updatedAt: "2026-08-25T00:00:00.000Z"
};

describe("Job Intelligence frontend", () => {
  it("renders opportunity summary and detail", () => {
    const markup = renderToStaticMarkup(<><JobOpportunityCard job={job} /><JobOpportunityDetail job={job} /></>);
    expect(markup).toContain("Senior QA Engineer");
    expect(markup).toContain("Em entrevistas");
    expect(markup).toContain("Descricao original");
    expect(markup).toContain("Abrir anuncio original");
  });

  it("builds only active list filters", () => {
    expect(buildJobQuery({ search: "api", status: "saved", workModel: "remote", seniority: "", favorite: "true" }))
      .toBe("search=api&status=saved&workModel=remote&favorite=true");
  });
});
