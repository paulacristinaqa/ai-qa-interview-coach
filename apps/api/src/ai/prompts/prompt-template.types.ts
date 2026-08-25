import { AiProviderRequest, AiTask } from "../ai-provider.types";

export type PromptDomain = "interview" | "guided-learning" | "grill-me" | "technical-lab" | "career";
export type PromptTemplateId =
  | "interview.opening"
  | "interview.follow-up"
  | "interview.feedback"
  | "guided-learning.explanation"
  | "grill-me.question"
  | "technical-lab.feedback"
  | "career.opportunity-analysis"
  | "career.job-analysis"
  | "career.competency-evaluation"
  | "career.document-pack";

export interface PromptTemplate {
  id: PromptTemplateId;
  domain: PromptDomain;
  task: AiTask;
  version: string;
  objective: string;
  expectedInputs: string[];
  outputFormat: string;
  outputSchema: Record<string, unknown>;
  safetyRules: string[];
  systemInstruction: string;
  criteria: string[];
}

export interface PromptInput {
  language: "pt-BR" | "en";
  userInput: string;
  context: Record<string, unknown>;
  criteria?: string[];
}

export function toProviderRequest(template: PromptTemplate, input: PromptInput): AiProviderRequest {
  return {
    templateId: template.id,
    task: template.task,
    language: input.language,
    systemInstruction: [
      template.systemInstruction,
      `Objective: ${template.objective}`,
      `Safety rules: ${template.safetyRules.join(" ")}`,
      `Output: ${template.outputFormat}`
    ].join("\n"),
    userInput: input.userInput,
    context: input.context,
    criteria: input.criteria ?? template.criteria,
    promptTemplateVersion: `${template.id}@${template.version}`,
    outputSchema: template.outputSchema
  };
}
