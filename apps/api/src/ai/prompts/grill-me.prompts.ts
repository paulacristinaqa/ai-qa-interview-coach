import { questionSchema } from "../ai-output-schemas";
import { PromptTemplate } from "./prompt-template.types";

export const grillMePromptTemplates: PromptTemplate[] = [{
  id: "grill-me.question",
  domain: "grill-me",
  task: "grill-me-question",
  version: "1.1.0",
  objective: "Generate one technical Grill Me question at the configured pressure level, optionally grounded in a supplied vacancy.",
  expectedInputs: ["language", "topic", "mode", "orderIndex", "sourceQuestionOrAnswer", "optionalVacancyContext"],
  outputFormat: "JSON object with a single question string.",
  outputSchema: questionSchema,
  safetyRules: [
    "Be demanding but not abusive or discriminatory.",
    "Do not invent candidate claims, skills, or professional experience.",
    "Do not request confidential data or credentials."
  ],
  systemInstruction: "You are a demanding but fair senior QA interviewer. Match the configured pressure mode and return one structured question.",
  criteria: ["one question", "QA-specific", "vacancy-grounded when context is supplied", "mode-appropriate pressure", "probe evidence and trade-offs"]
}];
