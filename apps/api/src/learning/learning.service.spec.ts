import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "../database/prisma.service";
import { LearningService } from "./learning.service";

function setup(priorLevels: string[]) {
  const create = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "event-1", ...data }));
  const prisma = {
    learningEvent: {
      findMany: vi.fn().mockResolvedValue(priorLevels.map((helpLevel) => ({ helpLevel }))),
      create
    }
  } as unknown as PrismaService;
  return { service: new LearningService(prisma), create };
}

describe("LearningService", () => {
  it("blocks the model answer before progressive support", async () => {
    const { service, create } = setup(["hint"]);
    const result = await service.hint("user-1", { concept: "API Testing", helpLevel: "model-answer" });

    expect(result.content).toMatchObject({ blocked: true });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ helpLevel: "model-answer" }) }));
  });

  it("unlocks an English model answer after hint, explanation and example", async () => {
    const { service } = setup(["hint", "explanation", "example"]);
    const result = await service.hint("user-1", { concept: "SQL", helpLevel: "model-answer", language: "en" });
    const content = result.content as { blocked?: boolean; explanation: string };

    expect(content.blocked).toBeUndefined();
    expect(content.explanation).toContain("Model answer");
  });

  it("falls back to a short hint for an unknown help level", async () => {
    const { service } = setup([]);
    const result = await service.hint("user-1", { concept: "Test Design", helpLevel: "unexpected" });

    expect(result.helpLevel).toBe("hint");
  });
});
