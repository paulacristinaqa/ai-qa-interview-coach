import Ajv, { ErrorObject } from "ajv";

export const questionSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: { question: { type: "string", minLength: 10 } },
  required: ["question"]
};

export const guidedLearningSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    explanation: { type: "string", minLength: 1 },
    nextPrompt: { type: "string", minLength: 1 }
  },
  required: ["explanation", "nextPrompt"]
};

export const feedbackSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    overallSummary: { type: "string", minLength: 1 },
    confidenceLevel: { type: "string", enum: ["low", "medium", "high"] },
    dimensions: {
      type: "array",
      minItems: 4,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          dimension: { type: "string", minLength: 1 },
          score: { type: "number", minimum: 0, maximum: 100 },
          evidence: { type: "string", minLength: 1 },
          recommendation: { type: "string", minLength: 1 }
        },
        required: ["dimension", "score", "evidence", "recommendation"]
      }
    }
  },
  required: ["overallSummary", "confidenceLevel", "dimensions"]
};

const ajv = new Ajv({ allErrors: true, strict: true });
const validatorCache = new WeakMap<object, ReturnType<Ajv["compile"]>>();

export class AiResponseValidationError extends Error {
  constructor(readonly code: "invalid_json" | "schema_mismatch", readonly validationErrors: ErrorObject[] = []) {
    super(code === "invalid_json" ? "AI returned invalid JSON" : "AI response does not match the expected schema");
    this.name = "AiResponseValidationError";
  }
}

export function parseAndValidateAiOutput<TOutput>(text: string, schema: Record<string, unknown>): TOutput {
  let output: unknown;
  try {
    output = JSON.parse(text);
  } catch {
    throw new AiResponseValidationError("invalid_json");
  }

  let validator = validatorCache.get(schema);
  if (!validator) {
    validator = ajv.compile(schema);
    validatorCache.set(schema, validator);
  }
  if (!validator(output)) {
    throw new AiResponseValidationError("schema_mismatch", validator.errors ?? []);
  }
  return output as TOutput;
}
