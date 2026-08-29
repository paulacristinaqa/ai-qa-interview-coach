import { describe, expect, it } from "vitest";
import type { JobOpportunity } from "../../lib/types";
import { languageFromJob, levelFromJob, levelFromNumber, suggestTopic } from "./page";

const job: JobOpportunity = {
  id: "job-1",
  title: "Senior QA Engineer",
  company: "Example Labs",
  country: "Portugal",
  city: null,
  workModel: "remote",
  seniority: "Senior",
  language: "English",
  link: null,
  originalDescription: "Own API contract testing and Playwright automation.",
  status: "saved",
  favorite: false,
  notes: null,
  createdAt: "2026-08-27T00:00:00.000Z",
  updatedAt: "2026-08-27T00:00:00.000Z",
  analysis: null
};

describe("job-specific Grill Me configuration", () => {
  it("derives topic, language and level from the selected vacancy", () => {
    expect(suggestTopic(job)).toBe("Automation");
    expect(languageFromJob(job)).toBe("en");
    expect(levelFromJob(job)).toBe("advanced");
  });

  it("prioritizes SQL and supports Portuguese junior vacancies", () => {
    const portugueseJob = {
      ...job,
      seniority: "Junior",
      language: "Portugues",
      originalDescription: "Validacao SQL e banco de dados"
    };
    expect(suggestTopic(portugueseJob)).toBe("SQL");
    expect(languageFromJob(portugueseJob)).toBe("pt-BR");
    expect(levelFromJob(portugueseJob)).toBe("basic");
  });

  it("maps a recommended bank question level to Grill Me", () => {
    expect([levelFromNumber(1), levelFromNumber(2), levelFromNumber(3)]).toEqual(["basic", "intermediate", "advanced"]);
  });
});
