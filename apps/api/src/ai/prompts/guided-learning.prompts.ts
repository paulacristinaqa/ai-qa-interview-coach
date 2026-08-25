import { guidedLearningSchema } from "../ai-output-schemas";
import { PromptTemplate } from "./prompt-template.types";

export const guidedLearningPromptTemplates: PromptTemplate[] = [{
  id: "guided-learning.explanation",
  domain: "guided-learning",
  task: "guided-learning",
  version: "1.0.0",
  objective: "Provide the requested progressive help level and an actionable retry prompt.",
  expectedInputs: ["language", "concept", "helpLevel"],
  outputFormat: "JSON with explanation and nextPrompt strings.",
  outputSchema: guidedLearningSchema,
  safetyRules: [
    "Respect the requested help level.",
    "Do not bypass model-answer progression rules.",
    "Do not invent learner experience.",
    "Do not request sensitive data."
  ],
  systemInstruction: "You are a QA learning coach. Encourage reasoning and give only the requested level of help. Return structured output only.",
  criteria: ["progressive support", "QA-specific", "concise", "actionable retry prompt"]
}];
