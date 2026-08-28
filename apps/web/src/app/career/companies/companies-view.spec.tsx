import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Company } from "../../../lib/types";
import { buildCompanyQuery, CompanyCard, CompanyDetail } from "./companies-view";

const company: Company = {
  id: "company-1",
  name: "Example Labs",
  website: "https://example.com/",
  linkedinUrl: "https://linkedin.com/company/example-labs",
  country: "Portugal",
  city: "Lisboa",
  industry: "Technology",
  size: "51-200",
  workCulture: "Quality ownership and collaboration.",
  notes: "Prepare API examples.",
  favorite: true,
  createdAt: "2026-08-28T00:00:00.000Z",
  updatedAt: "2026-08-28T00:00:00.000Z",
  opportunities: [{ id: "job-1", title: "Senior QA Engineer", company: "Example Labs", status: "interviewing", seniority: "Senior", country: "Portugal" }],
  contacts: [{
    id: "contact-1",
    companyId: "company-1",
    name: "Ana Recruiter",
    role: "Technical Recruiter",
    email: "ana@example.com",
    linkedinUrl: "https://linkedin.com/in/ana",
    notes: "Initial conversation completed.",
    lastContactAt: "2026-08-28T12:00:00.000Z",
    createdAt: "2026-08-28T00:00:00.000Z",
    updatedAt: "2026-08-28T00:00:00.000Z"
  }]
};

describe("Career Companies frontend", () => {
  it("renders company research, associated vacancies and contacts", () => {
    const markup = renderToStaticMarkup(<><CompanyCard company={company} /><CompanyDetail company={company} /></>);

    expect(markup).toContain("Example Labs");
    expect(markup).toContain("Quality ownership and collaboration");
    expect(markup).toContain("Senior QA Engineer");
    expect(markup).toContain("Ana Recruiter");
    expect(markup).toContain("ana@example.com");
    expect(markup).toContain("Website");
  });

  it("builds search and favorite filters", () => {
    expect(buildCompanyQuery({ search: "labs", favorite: "true" })).toBe("search=labs&favorite=true");
    expect(buildCompanyQuery({ search: "", favorite: "" })).toBe("");
  });
});
