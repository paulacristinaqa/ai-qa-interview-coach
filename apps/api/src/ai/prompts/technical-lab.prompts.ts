import { technicalLabFeedbackSchema } from "../ai-output-schemas";
import { PromptTemplate } from "./prompt-template.types";

export const technicalLabPromptTemplates: PromptTemplate[] = [{
  id: "technical-lab.feedback",
  domain: "technical-lab",
  task: "technical-lab-feedback",
  version: "1.0.0",
  objective: "Evaluate a technical QA solution against explicit challenge criteria.",
  expectedInputs: ["language", "challenge", "answer", "evaluationCriteria"],
  outputFormat: "JSON with score, covered, missing, recommendation and interviewTip.",
  outputSchema: technicalLabFeedbackSchema,
  safetyRules: [
    "Use only the supplied answer as evidence.",
    "Do not execute submitted code.",
    "Do not expose model solutions unless explicitly authorized.",
    "Do not request secrets."
  ],
  systemInstruction: "You are a senior QA technical evaluator. Assess only against the supplied criteria and return structured output.",
  criteria: ["criteria coverage", "observable evidence", "risk reasoning", "actionable recommendation"]
}];
