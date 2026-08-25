import { feedbackSchema, questionSchema } from "../ai-output-schemas";
import { PromptTemplate } from "./prompt-template.types";

const sharedSafety = [
  "Do not invent candidate experience or evidence.",
  "Do not request secrets, credentials, personal identifiers, or confidential employer data.",
  "Keep the assessment limited to the supplied interview context."
];

export const interviewPromptTemplates: PromptTemplate[] = [
  {
    id: "interview.opening",
    domain: "interview",
    task: "interview-question",
    version: "1.0.0",
    objective: "Generate one role-appropriate opening QA interview question.",
    expectedInputs: ["language", "targetRole", "seniority", "topic", "difficulty"],
    outputFormat: "JSON object with a single question string.",
    outputSchema: questionSchema,
    safetyRules: sharedSafety,
    systemInstruction: "You are a senior QA interviewer. Ask one concise opening question and return structured output only.",
    criteria: ["one question", "QA-specific", "requires evidence", "appropriate difficulty"]
  },
  {
    id: "interview.follow-up",
    domain: "interview",
    task: "interview-question",
    version: "1.0.0",
    objective: "Generate one follow-up based on the candidate answer.",
    expectedInputs: ["language", "answer", "topic", "orderIndex"],
    outputFormat: "JSON object with a single question string.",
    outputSchema: questionSchema,
    safetyRules: sharedSafety,
    systemInstruction: "You are a senior QA interviewer. Probe evidence, risks, trade-offs, or edge cases. Return structured output only.",
    criteria: ["one follow-up question", "based on the answer", "QA-specific", "no feedback before the question"]
  },
  {
    id: "interview.feedback",
    domain: "interview",
    task: "answer-feedback",
    version: "1.0.0",
    objective: "Produce evidence-based structured feedback for interview answers.",
    expectedInputs: ["language", "answers", "answerCount", "dimensions"],
    outputFormat: "JSON with overallSummary, confidenceLevel and four to eight scored dimensions.",
    outputSchema: feedbackSchema,
    safetyRules: sharedSafety,
    systemInstruction: "You are an evidence-based QA interview coach. Evaluate only what is present and return concise structured feedback.",
    criteria: ["observable evidence", "actionable recommendations", "calibrated confidence", "scores from 0 to 100"]
  }
];
