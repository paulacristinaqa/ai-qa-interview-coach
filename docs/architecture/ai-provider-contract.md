# AI Provider Contract

## Goal

Isolate application use cases from specific AI vendors and keep every generated response traceable.

## Request

```ts
export type AiTask =
  | "interview-question"
  | "answer-feedback"
  | "guided-learning"
  | "technical-lab-feedback";

export interface AiProviderRequest {
  task: AiTask;
  language: "pt-BR" | "en";
  systemInstruction: string;
  userInput: string;
  context: Record<string, unknown>;
  criteria: string[];
  promptTemplateVersion: string;
}
```

## Response

```ts
export interface AiProviderResponse<TOutput = unknown> {
  output: TOutput;
  modelName: string;
  providerName: string;
  promptTemplateVersion: string;
  confidenceLevel: "low" | "medium" | "high";
  evidence: string[];
  limitations: string[];
  createdAt: string;
}
```

## Rules

- The domain stores provider metadata but does not depend on provider SDKs.
- Prompt template versions must be explicit.
- Feedback outputs must include evidence and limitations.
- Logs must not contain complete private answers unless explicitly allowed for local debugging.
- Provider errors must return safe application errors and preserve retry context.

