import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ProfessionalEvidence } from "../../../lib/types";
import { buildEvidenceQuery, EvidenceCard } from "./evidence-view";

const evidence: ProfessionalEvidence = {
  id: "evidence-1",
  type: "project",
  title: "API automation modernization",
  description: "Designed a Playwright API regression suite with risk-based coverage.",
  skills: ["Playwright", "API Testing"],
  outcome: "Reduced the regression cycle to four hours.",
  sourceUrl: "https://example.com/evidence",
  occurredAt: "2026-08-28T12:00:00.000Z",
  favorite: true,
  createdAt: "2026-08-28T00:00:00.000Z",
  updatedAt: "2026-08-28T00:00:00.000Z"
};

describe("Professional Evidence frontend", () => {
  it("renders traceable evidence and its skills", () => {
    const markup = renderToStaticMarkup(<EvidenceCard evidence={evidence} />);
    expect(markup).toContain("API automation modernization");
    expect(markup).toContain("Reduced the regression cycle");
    expect(markup).toContain("Playwright");
    expect(markup).toContain("Abrir fonte informada");
  });

  it("builds active catalog filters", () => {
    expect(buildEvidenceQuery({ search: "api", type: "project", favorite: "true" })).toBe("search=api&type=project&favorite=true");
  });
});
