import { describe, expect, it } from "vitest";
import {
  AiResponseValidationError,
  careerDocumentPackSchema,
  jobPreparationPlanSchema,
  parseAndValidateAiOutput,
  questionSchema,
  technicalLabFeedbackSchema
} from "./ai-output-schemas";

describe("AI output validation", () => {
  it("accepts JSON matching the expected schema", () => {
    expect(parseAndValidateAiOutput<{ question: string }>(JSON.stringify({ question: "How would you test this API?" }), questionSchema))
      .toEqual({ question: "How would you test this API?" });
  });

  it("rejects invalid JSON", () => {
    expect(() => parseAndValidateAiOutput("not-json", questionSchema)).toThrowError(AiResponseValidationError);
  });

  it("rejects JSON that does not match the schema", () => {
    expect(() => parseAndValidateAiOutput(JSON.stringify({ answer: "wrong field" }), questionSchema)).toThrowError(
      AiResponseValidationError
    );
  });

  it("accepts a valid Technical Lab feedback response", () => {
    const output = {
      score: 82,
      covered: ["contract validation"],
      missing: ["observability"],
      recommendation: "Add failure-path evidence.",
      interviewTip: "Explain the risk before the test approach."
    };

    expect(parseAndValidateAiOutput(JSON.stringify(output), technicalLabFeedbackSchema)).toEqual(output);
  });

  it("rejects a Technical Lab score outside the allowed range", () => {
    const output = {
      score: 120,
      covered: [],
      missing: [],
      recommendation: "Review the score.",
      interviewTip: "Use observable evidence."
    };

    expect(() => parseAndValidateAiOutput(JSON.stringify(output), technicalLabFeedbackSchema)).toThrowError(
      AiResponseValidationError
    );
  });

  it("rejects unsupported claims in a Career document response", () => {
    const output = {
      cvMarkdown: "# CV",
      coverLetter: "Cover letter",
      fitMatrix: [],
      unsupportedClaims: ["Invented certification"]
    };

    expect(() => parseAndValidateAiOutput(JSON.stringify(output), careerDocumentPackSchema)).toThrowError(
      AiResponseValidationError
    );
  });

  it("accepts the reduced Career document pack", () => {
    const output = {
      cvMarkdown: "# CV",
      coverLetter: "Cover letter",
      fitMatrix: [{ requirement: "API testing", evidence: "Project evidence", status: "supported" }],
      unsupportedClaims: []
    };

    expect(parseAndValidateAiOutput(JSON.stringify(output), careerDocumentPackSchema)).toEqual(output);
  });

  it("accepts a grounded Career preparation plan item", () => {
    const output = {
      summary: "One required gap.",
      items: [{
        requirementId: "required-1",
        requirement: "Docker",
        sourceStatus: "gap",
        priority: "high",
        objective: "Build verifiable evidence.",
        actions: ["Practice in a small scenario."],
        successCriteria: ["Retain reproducible evidence."],
        recommendedModule: "technical-lab",
        documentAction: "omit-until-evidenced"
      }]
    };

    expect(parseAndValidateAiOutput(JSON.stringify(output), jobPreparationPlanSchema)).toEqual(output);
  });

  it("rejects a preparation plan without observable actions", () => {
    const output = {
      summary: "Invalid plan",
      items: [{
        requirementId: "required-1",
        requirement: "Docker",
        sourceStatus: "gap",
        priority: "high",
        objective: "Build evidence.",
        actions: [],
        successCriteria: ["Done"],
        recommendedModule: "technical-lab",
        documentAction: "omit-until-evidenced"
      }]
    };

    expect(() => parseAndValidateAiOutput(JSON.stringify(output), jobPreparationPlanSchema)).toThrowError(AiResponseValidationError);
  });
});
