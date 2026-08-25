import { Injectable, Logger } from "@nestjs/common";
import { AiProviderRequest, AiProviderResponse } from "./ai-provider.types";
import { MockAiProvider } from "./mock-ai.provider";
import { OllamaAiProvider, OllamaProviderError } from "./ollama-ai.provider";

@Injectable()
export class AiGateway {
  private readonly logger = new Logger(AiGateway.name);

  constructor(private readonly ollama: OllamaAiProvider, private readonly mock: MockAiProvider) {}

  async generate<TOutput>(request: AiProviderRequest, fallbackOutput: TOutput): Promise<AiProviderResponse<TOutput>> {
    const configured = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
    const provider = configured === "ollama" ? this.ollama : this.mock;
    const startedAt = Date.now();
    try {
      const response = await provider.generate(request, fallbackOutput);
      this.logger.log(JSON.stringify({
        event: "ai_request_completed",
        task: request.task,
        provider: response.providerName,
        model: response.modelName,
        durationMs: Date.now() - startedAt,
        fallback: false
      }));
      return response;
    } catch (error) {
      const safeCode = error instanceof OllamaProviderError ? error.code : "unknown";
      this.logger.warn(JSON.stringify({
        event: "ai_request_fallback",
        task: request.task,
        provider: provider.providerName,
        fallbackProvider: "mock",
        durationMs: Date.now() - startedAt,
        errorType: error instanceof Error ? error.name : "UnknownError",
        errorCode: safeCode,
        status: error instanceof OllamaProviderError ? error.status : undefined
      }));
      const fallback = await this.mock.generate(request, fallbackOutput);
      return {
        ...fallback,
        limitations: [...fallback.limitations, "The configured local provider failed; deterministic fallback was used."]
      };
    }
  }
}
