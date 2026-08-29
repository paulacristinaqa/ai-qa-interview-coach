import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { AiGateway } from "../ai/ai-gateway.service";
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
    const questions = { next: vi.fn().mockResolvedValue({ id: "q-1", topic: "API Testing", language: "en", prompt: "Explain API contract testing." }) } as unknown as QuestionsService;

    const result = await new GrillMeService(prisma, questions).start("user-1", {
      topic: "API Testing", language: "en", level: "advanced", mode: "realistic"
    });

    expect(result.session.turns[0].question).toContain("live interview");
    expect(questions.next).toHaveBeenCalledWith("user-1", "API Testing", "en", 3);
  });

  it("records an answer, evaluates it and creates a follow-up", async () => {
    const session = {
      id: "session-1", language: "en", targetRole: "QA", seniority: "advanced", topic: "API Testing",
      difficulty: "advanced", interviewerStyle: "grill-me:light-pressure:question:q-specific", status: "started",
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
        findFirst: vi.fn().mockResolvedValue(session),
        findUniqueOrThrow: vi.fn().mockResolvedValue(updated)
      },
      interviewTurn: { update: vi.fn(), create: vi.fn() },
      question: { findUnique: vi.fn().mockResolvedValue({ id: "q-specific" }), findFirst: vi.fn() }
    } as unknown as PrismaService;
    const questions = { attempt: vi.fn().mockResolvedValue({ id: "attempt-1", score: 72 }) } as unknown as QuestionsService;

    const result = await new GrillMeService(prisma, questions).answer("user-1", "session-1", { answer: "A concrete answer" });

    expect(result.attempt).toMatchObject({ id: "attempt-1" });
    expect(questions.attempt).toHaveBeenCalledWith("user-1", "q-specific", "A concrete answer", undefined);
    expect(prisma.interviewTurn.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ orderIndex: 2 }) }));
  });

  it("uses a locally generated opening question", async () => {
    const create = vi.fn().mockImplementation(({ data }) => Promise.resolve({
      id: "session-ai", language: data.language, targetRole: data.targetRole, seniority: data.seniority,
      topic: data.topic, difficulty: data.difficulty, interviewerStyle: data.interviewerStyle,
      status: "started", startedAt: new Date("2026-07-13T10:00:00Z"),
      turns: [{ orderIndex: 1, question: data.turns.create.question, answer: null, coachNote: null }]
    }));
    const prisma = { interviewSession: { create } } as unknown as PrismaService;
    const questions = { next: vi.fn().mockResolvedValue({ id: "q-1", topic: "API Testing", language: "en", prompt: "Source question" }) } as unknown as QuestionsService;
    const ai = { generate: vi.fn().mockResolvedValue({ output: { question: "Local Ollama Grill Me question" } }) } as unknown as AiGateway;

    const result = await new GrillMeService(prisma, questions, ai).start("user-1", {
      topic: "API Testing", language: "en", level: "advanced", mode: "realistic"
    });

    expect(result.session.turns[0].question).toBe("Local Ollama Grill Me question");
    expect(ai.generate).toHaveBeenCalledOnce();
  });

  it("grounds opening questions in an owned job opportunity", async () => {
    const create = vi.fn().mockImplementation(({ data }) => Promise.resolve({
      id: "session-job", language: data.language, targetRole: data.targetRole, seniority: data.seniority,
      topic: data.topic, difficulty: data.difficulty, interviewerStyle: data.interviewerStyle,
      status: "started", startedAt: new Date("2026-08-27T10:00:00Z"),
      turns: [{ orderIndex: 1, question: data.turns.create.question, answer: null, coachNote: null }]
    }));
    const prisma = {
      jobOpportunity: { findFirst: vi.fn().mockResolvedValue({
        id: "job-1", userId: "user-1", title: "Senior QA Engineer", company: "Example Labs",
        seniority: "Senior", originalDescription: "API automation role", analysis: {
          technicalSummary: "API quality leadership", requiredRequirements: ["Contract testing"],
          technologies: ["Playwright"], gaps: ["Performance testing"]
        }
      }) },
      interviewSession: { create }
    } as unknown as PrismaService;
    const questions = { next: vi.fn().mockResolvedValue({ id: "q-1", topic: "API Testing", language: "en", prompt: "Explain your API strategy." }) } as unknown as QuestionsService;
    const ai = { generate: vi.fn().mockImplementation((_request, fallback) => Promise.resolve({ output: fallback })) } as unknown as AiGateway;

    const result = await new GrillMeService(prisma, questions, ai).start("user-1", {
      topic: "API Testing", language: "en", level: "advanced", mode: "realistic", opportunityId: "job-1"
    });

    expect(result.jobContext).toEqual({ id: "job-1", title: "Senior QA Engineer", company: "Example Labs" });
    expect(result.session.targetRole).toBe("Senior QA Engineer");
    expect(result.session.interviewerStyle).toBe("grill-me:realistic:job:job-1:question:q-1");
    expect(result.session.turns[0].question).toContain("Senior QA Engineer role at Example Labs");
    expect(ai.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        promptTemplateVersion: "grill-me.question@1.1.0",
        context: expect.objectContaining({ vacancy: expect.objectContaining({ requirements: ["Contract testing"] }) })
      }),
      expect.any(Object)
    );
  });

  it("starts from an exact recommended catalog question", async () => {
    const create = vi.fn().mockImplementation(({ data }) => Promise.resolve({
      id: "session-recommended", language: data.language, targetRole: data.targetRole, seniority: data.seniority,
      topic: data.topic, difficulty: data.difficulty, interviewerStyle: data.interviewerStyle,
      status: "started", startedAt: new Date("2026-08-29T10:00:00Z"),
      turns: [{ orderIndex: 1, question: data.turns.create.question, answer: null, coachNote: null }]
    }));
    const prisma = { interviewSession: { create } } as unknown as PrismaService;
    const recommended = { id: "q-recommended", topic: "Behavioral", language: "en", level: 2, prompt: "Explain a difficult quality decision." };
    const questions = { get: vi.fn().mockResolvedValue(recommended), next: vi.fn() } as unknown as QuestionsService;

    const result = await new GrillMeService(prisma, questions).start("user-1", {
      topic: "Behavioral", language: "en", level: "intermediate", mode: "light-pressure", questionId: "q-recommended"
    });

    expect(questions.get).toHaveBeenCalledWith("q-recommended");
    expect(questions.next).not.toHaveBeenCalled();
    expect(result.sourceQuestion).toBe(recommended);
    expect(result.session.topic).toBe("Behavioral");
    expect(result.level).toBe("intermediate");
    expect(result.session.interviewerStyle).toContain(":question:q-recommended");
  });

  it("rejects a vacancy or session that is not owned by the user", async () => {
    const prisma = {
      jobOpportunity: { findFirst: vi.fn().mockResolvedValue(null) },
      interviewSession: { findFirst: vi.fn().mockResolvedValue(null) }
    } as unknown as PrismaService;
    const questions = { next: vi.fn() } as unknown as QuestionsService;
    const service = new GrillMeService(prisma, questions);

    await expect(service.start("user-1", {
      topic: "API Testing", language: "en", level: "advanced", mode: "realistic", opportunityId: "job-other"
    })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.answer("user-1", "session-other", { answer: "Attempt" })).rejects.toBeInstanceOf(NotFoundException);
  });
});
