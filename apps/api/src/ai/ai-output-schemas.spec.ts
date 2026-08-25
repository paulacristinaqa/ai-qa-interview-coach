import { describe, expect, it } from "vitest";
import { AiResponseValidationError, parseAndValidateAiOutput, questionSchema } from "./ai-output-schemas";

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
});
