import { describe, expect, it, vi } from "vitest";
import { createAiRequest } from "./ai-requests";
import { OllamaAiProvider, OllamaProviderError } from "./ollama-ai.provider";

const request = createAiRequest("interview.opening", {
  language: "en",
  userInput: "API Testing",
  context: { role: "QA Engineer" }
});

describe("OllamaAiProvider", () => {
  it("calls the local chat API and validates structured output", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      model: "qwen3:4b",
      message: { content: JSON.stringify({ question: "How would you validate an API contract?" }) }
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const provider = new OllamaAiProvider({ baseUrl: "http://127.0.0.1:11434", model: "qwen3:4b" }, fetchImpl);

    const result = await provider.generate(request, { question: "fallback" });

    expect(result.providerName).toBe("ollama");
    expect(result.output.question).toContain("API contract");
    expect(fetchImpl).toHaveBeenCalledWith("http://127.0.0.1:11434/api/chat", expect.objectContaining({ method: "POST" }));
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body as string);
    expect(body.stream).toBe(false);
    expect(body.format).toEqual(request.outputSchema);
  });

  it("rejects malformed model output without leaking its content", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      model: "qwen3:4b",
      message: { content: "not-json" }
    }), { status: 200 }));
    const provider = new OllamaAiProvider({}, fetchImpl);

    await expect(provider.generate(request, { question: "fallback" })).rejects.toMatchObject({
      name: "OllamaProviderError",
      code: "invalid_response"
    });
  });

  it("aborts a request after the configured timeout", async () => {
    const fetchImpl = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      });
    })) as unknown as typeof fetch;
    const provider = new OllamaAiProvider({ timeoutMs: 5 }, fetchImpl);

    await expect(provider.generate(request, { question: "fallback" })).rejects.toBeInstanceOf(OllamaProviderError);
    await expect(provider.generate(request, { question: "fallback" })).rejects.toMatchObject({ code: "timeout" });
  });
});
