import { describe, expect, it } from "vitest";
import { createPromptRequest, getPromptTemplate, promptTemplates } from "./prompt-template.registry";

describe("prompt template registry", () => {
  it("covers every AI domain with complete versioned metadata", () => {
    expect(new Set(promptTemplates.map((template) => template.domain))).toEqual(new Set([
      "interview",
      "guided-learning",
      "grill-me",
      "technical-lab",
      "career"
    ]));

    const ids = new Set<string>();
    for (const template of promptTemplates) {
      expect(ids.has(template.id)).toBe(false);
      ids.add(template.id);
      expect(template.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(template.objective.length).toBeGreaterThan(0);
      expect(template.expectedInputs.length).toBeGreaterThan(0);
      expect(template.outputFormat.length).toBeGreaterThan(0);
      expect(template.outputSchema).toMatchObject({ type: "object" });
      expect(template.safetyRules.length).toBeGreaterThan(0);
      expect(template.criteria.length).toBeGreaterThan(0);
    }
  });

  it("creates a canonical provider request with immutable version metadata", () => {
    const request = createPromptRequest("interview.opening", {
      language: "en",
      userInput: "Generate a question about API testing.",
      context: { targetRole: "QA Engineer", seniority: "Senior", topic: "API", difficulty: "hard" }
    });

    expect(request.templateId).toBe("interview.opening");
    expect(request.promptTemplateVersion).toBe("interview.opening@1.0.0");
    expect(request.outputSchema).toBe(getPromptTemplate("interview.opening").outputSchema);
    expect(request.systemInstruction).toContain("Safety rules:");
    expect(request.criteria).toContain("QA-specific");
  });

  it("allows explicit evaluation criteria without mutating the template", () => {
    const originalCriteria = [...getPromptTemplate("technical-lab.feedback").criteria];
    const request = createPromptRequest("technical-lab.feedback", {
      language: "pt-BR",
      userInput: "Minha solucao",
      context: { challenge: "API", evaluationCriteria: ["contrato"] },
      criteria: ["criterio especifico"]
    });

    expect(request.criteria).toEqual(["criterio especifico"]);
    expect(getPromptTemplate("technical-lab.feedback").criteria).toEqual(originalCriteria);
  });

  it("limits the reduced Career document pack to Portuguese or English", () => {
    const template = getPromptTemplate("career.document-pack");

    expect(template.version).toBe("2.0.0");
    expect(template.expectedInputs).toContain("language");
    expect(template.systemInstruction).toContain("Brazilian Portuguese or English");
    expect(Object.keys((template.outputSchema as { properties: Record<string, unknown> }).properties)).toEqual([
      "cvMarkdown", "coverLetter", "fitMatrix", "unsupportedClaims"
    ]);
  });
});
