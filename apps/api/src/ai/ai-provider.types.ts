export type AiTask = "interview-question" | "answer-feedback" | "guided-learning" | "grill-me-question";

export interface AiProviderRequest {
  templateId: string;
  task: AiTask;
  language: "pt-BR" | "en";
  systemInstruction: string;
  userInput: string;
  context: Record<string, unknown>;
  promptTemplateVersion: string;
  outputSchema: Record<string, unknown>;
}

export interface AiProviderResponse<TOutput = unknown> {
  output: TOutput;
  modelName: string;
  providerName: string;
  promptTemplateVersion: string;
  confidenceLevel: "low" | "medium" | "high";
  limitations: string[];
  createdAt: string;
}

export abstract class AiProvider {
  abstract readonly providerName: string;
  abstract generate<TOutput>(request: AiProviderRequest, fallbackOutput: TOutput): Promise<AiProviderResponse<TOutput>>;
}
