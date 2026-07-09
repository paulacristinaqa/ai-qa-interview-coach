import { describe, expect, it } from "vitest";
import { InterviewsService } from "./interviews.service";

describe("InterviewsService", () => {
  it("starts an English interview and asks a topic-aware question", async () => {
    const service = new InterviewsService();

    const session = await service.start({
      language: "en",
      targetRole: "QA Automation Engineer",
      seniority: "Senior",
      topic: "API Testing",
      difficulty: "advanced"
    });

    expect(session.turns[0].question).toContain("API Testing");
    expect(session.turns[0].question).toContain("QA Automation Engineer");
  });

  it("records answers and generates a follow-up", async () => {
    const service = new InterviewsService();
    const session = await service.start({
      language: "pt-BR",
      targetRole: "QA Engineer",
      seniority: "Senior",
      topic: "SQL",
      difficulty: "medium"
    });

    const updated = await service.submitAnswer(session.id, { answer: "Eu validaria joins e regras de negocio." });

    expect(updated.turns[0].answer).toContain("validaria");
    expect(updated.turns[1].question).toContain("SQL");
  });
});
