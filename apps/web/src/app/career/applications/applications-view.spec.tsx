import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { JobApplication } from "../../../lib/types";
import { ApplicationCard, ApplicationSummary, buildApplicationQuery } from "./applications-view";

const application: JobApplication = {
  id: "application-1",
  opportunityId: "job-1",
  status: "interview",
  appliedAt: "2026-08-20T12:00:00.000Z",
  nextAction: "Prepare API testing examples",
  nextActionAt: "2026-08-29T12:00:00.000Z",
  notes: "Recruiter call completed.",
  createdAt: "2026-08-20T12:00:00.000Z",
  updatedAt: "2026-08-25T12:00:00.000Z",
  opportunity: {
    id: "job-1", title: "Senior QA Engineer", company: "Example Labs", country: "Portugal", city: "Lisboa",
    workModel: "hybrid", seniority: "Senior", language: "English", link: null,
    originalDescription: "Own quality strategy.", status: "applied", favorite: true, notes: null,
    createdAt: "2026-08-20T12:00:00.000Z", updatedAt: "2026-08-25T12:00:00.000Z"
  }
};

describe("Job Applications frontend", () => {
  it("renders the application stage, deadline and next action", () => {
    const markup = renderToStaticMarkup(<ApplicationCard application={application} />);
    expect(markup).toContain("Senior QA Engineer");
    expect(markup).toContain("Entrevista");
    expect(markup).toContain("Prepare API testing examples");
    expect(markup).toContain("29/08/2026");
  });

  it("builds only active filters", () => {
    expect(buildApplicationQuery({ search: "Example", status: "interview" })).toBe("search=Example&status=interview");
    expect(buildApplicationQuery({ search: "", status: "" })).toBe("");
  });

  it("summarizes active, interview and offer stages", () => {
    const markup = renderToStaticMarkup(<ApplicationSummary applications={[
      application,
      { ...application, id: "application-2", status: "offer" },
      { ...application, id: "application-3", status: "rejected" }
    ]} />);
    expect(markup).toContain("Ativas</span><strong>2");
    expect(markup).toContain("Em entrevistas</span><strong>1");
    expect(markup).toContain("Propostas</span><strong>1");
  });
});
