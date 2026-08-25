import { careerPromptTemplates } from "./career.prompts";
import { grillMePromptTemplates } from "./grill-me.prompts";
import { guidedLearningPromptTemplates } from "./guided-learning.prompts";
import { interviewPromptTemplates } from "./interview.prompts";
import { PromptInput, PromptTemplate, PromptTemplateId, toProviderRequest } from "./prompt-template.types";
import { technicalLabPromptTemplates } from "./technical-lab.prompts";

export const promptTemplates: readonly PromptTemplate[] = [
  ...interviewPromptTemplates,
  ...guidedLearningPromptTemplates,
  ...grillMePromptTemplates,
  ...technicalLabPromptTemplates,
  ...careerPromptTemplates
];

const templateById = new Map(promptTemplates.map((template) => [template.id, template]));

export function getPromptTemplate(id: PromptTemplateId) {
  const template = templateById.get(id);
  if (!template) throw new Error(`Prompt template not found: ${id}`);
  return template;
}

export function createPromptRequest(id: PromptTemplateId, input: PromptInput) {
  return toProviderRequest(getPromptTemplate(id), input);
}
