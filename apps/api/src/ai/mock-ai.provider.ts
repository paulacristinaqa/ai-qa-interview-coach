import { Injectable } from "@nestjs/common";
import { AiProvider, AiProviderRequest, AiProviderResponse } from "./ai-provider.types";

@Injectable()
export class MockAiProvider implements AiProvider {
  readonly providerName = "mock";

  async generate<TOutput>(request: AiProviderRequest, fallbackOutput: TOutput): Promise<AiProviderResponse<TOutput>> {
    return {
      output: fallbackOutput,
      modelName: "deterministic-mvp-evaluator",
      providerName: this.providerName,
      promptTemplateVersion: request.promptTemplateVersion,
      confidenceLevel: "low",
      limitations: ["No generative model was used."],
      createdAt: new Date().toISOString()
    };
  }
}
