import { afterEach, describe, expect, it, vi } from "vitest";
import { AiGateway } from "./ai-gateway.service";
import { createAiRequest } from "./ai-requests";
import { MockAiProvider } from "./mock-ai.provider";
import { OllamaAiProvider, OllamaProviderError } from "./ollama-ai.provider";

const request = createAiRequest("guided-learning.explanation", {
  language: "en",
  userInput: "SQL",
  context: { concept: "SQL", helpLevel: "hint" }
});

describe("AiGateway", () => {
  const originalProvider = process.env.AI_PROVIDER;

  afterEach(() => {
    if (originalProvider === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = originalProvider;
    vi.restoreAllMocks();
  });

  it("uses the deterministic mock provider by default", async () => {
    delete process.env.AI_PROVIDER;
    const ollama = { providerName: "ollama", generate: vi.fn() } as unknown as OllamaAiProvider;

    const result = await new AiGateway(ollama, new MockAiProvider()).generate(request, {
      explanation: "fallback",
      nextPrompt: "retry"
    });

    expect(result.providerName).toBe("mock");
    expect(ollama.generate).not.toHaveBeenCalled();
  });

  it("falls back to mock when local Ollama is unavailable", async () => {
    process.env.AI_PROVIDER = "ollama";
    const ollama = {
      providerName: "ollama",
      generate: vi.fn().mockRejectedValue(new OllamaProviderError("unavailable"))
    } as unknown as OllamaAiProvider;

    const result = await new AiGateway(ollama, new MockAiProvider()).generate(request, {
      explanation: "fallback",
      nextPrompt: "retry"
    });

    expect(result.providerName).toBe("mock");
    expect(result.output.explanation).toBe("fallback");
    expect(result.limitations.at(-1)).toContain("fallback");
  });
});
