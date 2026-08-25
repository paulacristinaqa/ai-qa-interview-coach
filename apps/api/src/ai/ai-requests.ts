import { feedbackSchema, guidedLearningSchema, questionSchema } from "./ai-output-schemas";
import { AiProviderRequest } from "./ai-provider.types";

type TemplateId =
  | "interview.opening"
  | "interview.follow-up"
  | "interview.feedback"
  | "guided-learning.explanation"
  | "grill-me.question";

const templates: Record<TemplateId, Omit<AiProviderRequest, "language" | "userInput" | "context">> = {
  "interview.opening": {
    templateId: "interview.opening",
    task: "interview-question",
    promptTemplateVersion: "interview-opening-v1",
    systemInstruction: questionInstruction("Create one concise opening interview question. Use only the supplied role and topic."),
    outputSchema: questionSchema
  },
  "interview.follow-up": {
    templateId: "interview.follow-up",
    task: "interview-question",
    promptTemplateVersion: "interview-follow-up-v1",
    systemInstruction: questionInstruction("Create one concise follow-up question grounded in the supplied answer and topic."),
    outputSchema: questionSchema
  },
  "interview.feedback": {
    templateId: "interview.feedback",
    task: "answer-feedback",
    promptTemplateVersion: "interview-feedback-v1",
    systemInstruction:
      "Act as a supportive QA interview coach. Evaluate only evidence present in the answers. Never invent experience, identity, scores, or facts. Return valid JSON matching the supplied schema and no extra text.",
    outputSchema: feedbackSchema
  },
  "guided-learning.explanation": {
    templateId: "guided-learning.explanation",
    task: "guided-learning",
    promptTemplateVersion: "guided-learning-v1",
    systemInstruction:
      "Teach the supplied QA concept at the requested help level. Preserve progressive learning: do not reveal more than requested. Return valid JSON matching the supplied schema and no extra text.",
    outputSchema: guidedLearningSchema
  },
  "grill-me.question": {
    templateId: "grill-me.question",
    task: "grill-me-question",
    promptTemplateVersion: "grill-me-question-v1",
    systemInstruction: questionInstruction("Create one QA interview question with the requested pressure level. Do not insult or discriminate."),
    outputSchema: questionSchema
  }
};

export function createAiRequest(
  templateId: TemplateId,
  input: Pick<AiProviderRequest, "language" | "userInput" | "context">
): AiProviderRequest {
  return { ...templates[templateId], ...input };
}

function questionInstruction(objective: string) {
  return `${objective} Do not invent candidate experience or personal information. Return valid JSON matching the supplied schema and no extra text.`;
}
