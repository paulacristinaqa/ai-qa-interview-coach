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

export const technicalLabFeedbackSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: { type: "number", minimum: 0, maximum: 100 },
    covered: { type: "array", items: { type: "string" } },
    missing: { type: "array", items: { type: "string" } },
    recommendation: { type: "string", minLength: 1 },
    interviewTip: { type: "string", minLength: 1 }
  },
  required: ["score", "covered", "missing", "recommendation", "interviewTip"]
};

export const careerAnalysisSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string", minLength: 1 },
    fitScore: { type: "number", minimum: 0, maximum: 100 },
    strengths: { type: "array", items: { type: "string" } },
    gaps: { type: "array", items: { type: "string" } },
    nextActions: { type: "array", items: { type: "string" } }
  },
  required: ["summary", "fitScore", "strengths", "gaps", "nextActions"]
};

export const jobAnalysisSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    technicalSummary: { type: "string", minLength: 1 },
    responsibilities: stringArraySchema(),
    requiredRequirements: stringArraySchema(),
    preferredRequirements: stringArraySchema(),
    technologies: stringArraySchema(),
    softSkills: stringArraySchema(),
    estimatedSeniority: { type: "string", minLength: 1 },
    profileFit: {
      type: "object",
      additionalProperties: false,
      properties: {
        score: { type: "number", minimum: 0, maximum: 100 },
        summary: { type: "string", minLength: 1 },
        evidence: stringArraySchema()
      },
      required: ["score", "summary", "evidence"]
    },
    gaps: stringArraySchema(),
    preparationPlan: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          priority: { type: "string", enum: ["high", "medium", "low"] },
          action: { type: "string", minLength: 1 },
          rationale: { type: "string", minLength: 1 }
        },
        required: ["priority", "action", "rationale"]
      }
    }
  },
  required: [
    "technicalSummary",
    "responsibilities",
    "requiredRequirements",
    "preferredRequirements",
    "technologies",
    "softSkills",
    "estimatedSeniority",
    "profileFit",
    "gaps",
    "preparationPlan"
  ]
};

export const competencyEvaluationSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string", minLength: 1 },
    overallScore: { type: "number", minimum: 0, maximum: 100 },
    requirements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string", minLength: 1 },
          text: { type: "string", minLength: 1 },
          category: {
            type: "string",
            enum: ["technical", "experience", "education", "certification", "language", "soft_skill", "other"]
          },
          importance: { type: "string", enum: ["required", "preferred"] },
          status: { type: "string", enum: ["supported", "partial", "gap"] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          evidenceIds: { type: "array", uniqueItems: true, items: { type: "string", minLength: 1 } },
          rationale: { type: "string", minLength: 1 },
          documentGuidance: { type: "string", minLength: 1 }
        },
        required: ["id", "text", "category", "importance", "status", "confidence", "evidenceIds", "rationale", "documentGuidance"]
      }
    }
  },
  required: ["summary", "overallScore", "requirements"]
};

export const careerDocumentPackSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    cvMarkdown: { type: "string", minLength: 1 },
    coverLetter: { type: "string", minLength: 1 },
    fitMatrix: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          requirement: { type: "string", minLength: 1 },
          evidence: { type: "string", minLength: 1 },
          status: { type: "string", enum: ["supported", "partial", "gap"] }
        },
        required: ["requirement", "evidence", "status"]
      }
    },
    unsupportedClaims: { type: "array", maxItems: 0, items: { type: "string" } }
  },
  required: ["cvMarkdown", "coverLetter", "fitMatrix", "unsupportedClaims"]
};

const ajv = new Ajv({ allErrors: true, strict: true });
const validatorCache = new WeakMap<object, ReturnType<Ajv["compile"]>>();

export class AiResponseValidationError extends Error {
  constructor(readonly code: "invalid_json" | "schema_mismatch", readonly validationErrors: ErrorObject[] = []) {
    super(code === "invalid_json" ? "AI returned invalid JSON" : "AI response does not match the expected schema");
    this.name = "AiResponseValidationError";
  }
}

export function validateAiOutput<TOutput>(schema: Record<string, unknown>, output: unknown): TOutput {
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

export function parseAndValidateAiOutput<TOutput>(text: string, schema: Record<string, unknown>): TOutput {
  let output: unknown;
  try {
    output = JSON.parse(text);
  } catch {
    throw new AiResponseValidationError("invalid_json");
  }

  return validateAiOutput<TOutput>(schema, output);
}

function stringArraySchema() {
  return { type: "array", items: { type: "string", minLength: 1 } };
}
