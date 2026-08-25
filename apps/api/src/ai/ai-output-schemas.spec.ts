import { describe, expect, it } from "vitest";
import {
  AiResponseValidationError,
  careerDocumentPackSchema,
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
      chineseSummary: "中文摘要",
      fitMatrix: [],
      unsupportedClaims: ["Invented certification"]
    };

    expect(() => parseAndValidateAiOutput(JSON.stringify(output), careerDocumentPackSchema)).toThrowError(
      AiResponseValidationError
    );
  });
});
