import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "../database/prisma.service";
import { QuestionsService } from "../questions/questions.service";
import { GrillMeService } from "./grill-me.service";

describe("GrillMeService", () => {
  it("starts a pressure session from the selected question", async () => {
    const create = vi.fn().mockImplementation(({ data }) => Promise.resolve({
      id: "session-1", language: data.language, targetRole: data.targetRole, seniority: data.seniority,
      topic: data.topic, difficulty: data.difficulty, interviewerStyle: data.interviewerStyle,
      status: "started", startedAt: new Date("2026-07-13T10:00:00Z"),
      turns: [{ orderIndex: 1, question: data.turns.create.question, answer: null, coachNote: null }]
    }));
    const prisma = { interviewSession: { create } } as unknown as PrismaService;
    const questions = { next: vi.fn().mockResolvedValue({ id: "q-1", prompt: "Explain API contract testing." }) } as unknown as QuestionsService;

    const result = await new GrillMeService(prisma, questions).start("user-1", {
      topic: "API Testing", language: "en", level: "advanced", mode: "realistic"
    });

    expect(result.session.turns[0].question).toContain("live interview");
    expect(questions.next).toHaveBeenCalledWith("user-1", "API Testing", "en", 3);
  });

  it("records an answer, evaluates it and creates a follow-up", async () => {
    const session = {
      id: "session-1", language: "en", targetRole: "QA", seniority: "advanced", topic: "API Testing",
      difficulty: "advanced", interviewerStyle: "grill-me:light-pressure", status: "started",
      startedAt: new Date("2026-07-13T10:00:00Z"),
      turns: [{ id: "turn-1", orderIndex: 1, question: "Question", answer: null, coachNote: null }]
    };
    const updated = {
      ...session,
      turns: [
        { ...session.turns[0], answer: "A concrete answer", coachNote: "note" },
        { id: "turn-2", orderIndex: 2, question: "Follow-up", answer: null, coachNote: null }
      ]
    };
    const prisma = {
      interviewSession: {
        findUnique: vi.fn().mockResolvedValue(session),
        findUniqueOrThrow: vi.fn().mockResolvedValue(updated)
      },
      interviewTurn: { update: vi.fn(), create: vi.fn() },
      question: { findFirst: vi.fn().mockResolvedValue({ id: "q-1" }) }
    } as unknown as PrismaService;
    const questions = { attempt: vi.fn().mockResolvedValue({ id: "attempt-1", score: 72 }) } as unknown as QuestionsService;

    const result = await new GrillMeService(prisma, questions).answer("user-1", "session-1", { answer: "A concrete answer" });

    expect(result.attempt).toMatchObject({ id: "attempt-1" });
    expect(prisma.interviewTurn.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ orderIndex: 2 }) }));
  });
});
