import "reflect-metadata";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { AuthController } from "../auth/auth.controller";
import { AuthService } from "../auth/auth.service";
import { ApplicationsController } from "../applications/applications.controller";
import { ApplicationsService } from "../applications/applications.service";
import { CriController } from "../cri/cri.controller";
import { CriService } from "../cri/cri.service";
import { DiaryController } from "../diary/diary.controller";
import { DiaryService } from "../diary/diary.service";
import { FeedbackController } from "../feedback/feedback.controller";
import { FeedbackService } from "../feedback/feedback.service";
import { GrillMeController } from "../grill-me/grill-me.controller";
import { GrillMeService } from "../grill-me/grill-me.service";
import { InterviewsController } from "../interviews/interviews.controller";
import { InterviewsService } from "../interviews/interviews.service";
import { KnowledgeController } from "../knowledge/knowledge.controller";
import { KnowledgeService } from "../knowledge/knowledge.service";
import { JobsController } from "../jobs/jobs.controller";
import { JobsService } from "../jobs/jobs.service";
import { JobAnalysisController } from "../jobs/job-analysis.controller";
import { JobAnalysisService } from "../jobs/job-analysis.service";
import { LearningController } from "../learning/learning.controller";
import { LearningService } from "../learning/learning.service";
import { TechnicalLabController } from "../technical-lab/technical-lab.controller";
import { TechnicalLabService } from "../technical-lab/technical-lab.service";

describe("main API endpoints", () => {
  let app: NestFastifyApplication;
  let authorization: string;

  const feedbackService = {
    generate: vi.fn().mockResolvedValue({ id: "report-1", overallSummary: "Structured feedback", confidenceLevel: "low", dimensions: [] })
  };
  const grillMeService = {
    start: vi.fn().mockImplementation((_userId, body) => ({
      mode: body.mode,
      level: body.level,
      session: { id: "grill-1", status: "started", turns: [{ orderIndex: 1, question: "How would you test this API?" }] }
    })),
    answer: vi.fn()
  };
  const learningService = {
    hint: vi.fn().mockResolvedValue({ id: "event-1", helpLevel: "hint", content: { explanation: "Start with risk" } })
  };
  const technicalLabService = {
    list: vi.fn().mockResolvedValue([{ id: "lab-1", title: "API challenge" }]),
    attempt: vi.fn().mockResolvedValue({ id: "attempt-1", feedback: { score: 80 } }),
    reveal: vi.fn()
  };
  const knowledgeService = {
    list: vi.fn().mockResolvedValue([]),
    history: vi.fn().mockResolvedValue({ interviews: [{ id: "session-1" }], questionAttempts: [], technicalAttempts: [] }),
    exportMarkdown: vi.fn(),
    create: vi.fn().mockImplementation((userId, body) => ({ id: "note-1", userId, ...body })),
    update: vi.fn()
  };
  const criService = {
    current: vi.fn().mockResolvedValue({ score: 58, confidenceLevel: "low", composition: { evidenceCount: 1 }, evidenceGaps: [] })
  };
  const diaryService = {
    list: vi.fn().mockResolvedValue([{ id: "entry-1", title: "Coverage" }]),
    exportMarkdown: vi.fn(),
    suggestions: vi.fn(),
    create: vi.fn().mockImplementation((userId, body) => ({ id: "entry-1", userId, ...body })),
    update: vi.fn()
  };
  const jobsService = {
    list: vi.fn().mockResolvedValue([{ id: "job-1", title: "Senior QA Engineer", company: "Example Labs", status: "saved" }]),
    get: vi.fn().mockResolvedValue({ id: "job-1", title: "Senior QA Engineer", company: "Example Labs", status: "saved" }),
    create: vi.fn().mockImplementation((userId, body) => ({ id: "job-1", userId, ...body, status: body.status ?? "saved" })),
    update: vi.fn().mockImplementation((_userId, id, body) => ({ id, ...body })),
    remove: vi.fn().mockResolvedValue(undefined)
  };
  const jobAnalysisService = {
    analyze: vi.fn().mockResolvedValue({
      id: "analysis-1",
      opportunityId: "job-1",
      technicalSummary: "API-focused QA role",
      profileFit: { score: 70, summary: "Evidence-based fit", evidence: ["CRI"] }
    })
  };
  const applicationsService = {
    list: vi.fn().mockResolvedValue([{ id: "application-1", status: "applied", opportunity: { id: "job-1" } }]),
    get: vi.fn(),
    create: vi.fn().mockImplementation((userId, body) => ({ id: "application-1", userId, ...body, status: body.status ?? "planned" })),
    update: vi.fn().mockImplementation((_userId, id, body) => ({ id, ...body })),
    remove: vi.fn().mockResolvedValue(undefined)
  };

  beforeAll(async () => {
    Reflect.defineMetadata("design:paramtypes", [AuthService], AuthController);
    Reflect.defineMetadata("design:paramtypes", [AuthService, InterviewsService], InterviewsController);
    Reflect.defineMetadata("design:paramtypes", [AuthService, GrillMeService], GrillMeController);
    Reflect.defineMetadata("design:paramtypes", [AuthService, FeedbackService], FeedbackController);
    Reflect.defineMetadata("design:paramtypes", [AuthService, LearningService], LearningController);
    Reflect.defineMetadata("design:paramtypes", [AuthService, TechnicalLabService], TechnicalLabController);
    Reflect.defineMetadata("design:paramtypes", [AuthService, KnowledgeService], KnowledgeController);
    Reflect.defineMetadata("design:paramtypes", [AuthService, CriService], CriController);
    Reflect.defineMetadata("design:paramtypes", [AuthService, DiaryService], DiaryController);
    Reflect.defineMetadata("design:paramtypes", [AuthService, JobsService], JobsController);
    Reflect.defineMetadata("design:paramtypes", [AuthService, JobAnalysisService], JobAnalysisController);
    Reflect.defineMetadata("design:paramtypes", [AuthService, ApplicationsService], ApplicationsController);

    const moduleRef = await Test.createTestingModule({
      controllers: [
        AuthController,
        InterviewsController,
        GrillMeController,
        FeedbackController,
        LearningController,
        TechnicalLabController,
        KnowledgeController,
        CriController,
        DiaryController,
        JobsController,
        JobAnalysisController,
        ApplicationsController
      ],
      providers: [
        AuthService,
        { provide: InterviewsService, useValue: new InterviewsService() },
        { provide: GrillMeService, useValue: grillMeService },
        { provide: FeedbackService, useValue: feedbackService },
        { provide: LearningService, useValue: learningService },
        { provide: TechnicalLabService, useValue: technicalLabService },
        { provide: KnowledgeService, useValue: knowledgeService },
        { provide: CriService, useValue: criService },
        { provide: DiaryService, useValue: diaryService },
        { provide: JobsService, useValue: jobsService },
        { provide: JobAnalysisService, useValue: jobAnalysisService },
        { provide: ApplicationsService, useValue: applicationsService }
      ]
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.setGlobalPrefix("api/v1");
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "paula@example.com", password: "change-me-locally" }
    });
    expect(login.statusCode).toBe(201);
    authorization = `Bearer ${login.json().accessToken}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("starts an interview, accepts an answer and returns feedback", async () => {
    const started = await app.inject({
      method: "POST",
      url: "/api/v1/interviews",
      headers: { authorization },
      payload: { language: "en", targetRole: "QA Engineer", seniority: "Senior", topic: "API Testing", difficulty: "advanced" }
    });
    expect(started.statusCode).toBe(201);
    const session = started.json();

    const answered = await app.inject({
      method: "POST",
      url: `/api/v1/interviews/${session.id}/answers`,
      headers: { authorization },
      payload: { answer: "I would validate the contract and error paths." }
    });
    expect(answered.statusCode).toBe(201);
    expect(answered.json().turns[0].answer).toContain("contract");

    const feedback = await app.inject({
      method: "POST",
      url: `/api/v1/feedback/sessions/${session.id}`,
      headers: { authorization }
    });
    expect(feedback.statusCode).toBe(201);
    expect(feedback.json().id).toBe("report-1");
  });

  it("routes Grill Me, Guided Learning and Technical Lab", async () => {
    const grill = await app.inject({
      method: "POST",
      url: "/api/v1/grill-me/sessions",
      headers: { authorization },
      payload: { topic: "API Testing", language: "en", level: "advanced", mode: "realistic" }
    });
    const learning = await app.inject({
      method: "POST",
      url: "/api/v1/learning/hint",
      headers: { authorization },
      payload: { concept: "SQL", helpLevel: "hint" }
    });
    const labs = await app.inject({ method: "GET", url: "/api/v1/technical-lab/challenges", headers: { authorization } });

    expect([grill.statusCode, learning.statusCode, labs.statusCode]).toEqual([201, 201, 200]);
    expect(grill.json().session.status).toBe("started");
    expect(learning.json().helpLevel).toBe("hint");
  });

  it("routes Knowledge, CRI and Developer Diary for the authenticated user", async () => {
    const note = await app.inject({
      method: "POST",
      url: "/api/v1/knowledge",
      headers: { authorization },
      payload: { type: "learning", title: "API", body: "Evidence" }
    });
    const history = await app.inject({ method: "GET", url: "/api/v1/knowledge/history", headers: { authorization } });
    const cri = await app.inject({ method: "GET", url: "/api/v1/cri/current", headers: { authorization } });
    const diary = await app.inject({
      method: "POST",
      url: "/api/v1/diary/entries",
      headers: { authorization },
      payload: { entryType: "changelog", title: "Coverage" }
    });

    expect([note.statusCode, history.statusCode, cri.statusCode, diary.statusCode]).toEqual([201, 200, 200, 201]);
    expect(note.json().userId).toBe("single-user");
    expect(history.json().interviews[0].id).toBe("session-1");
    expect(cri.json().score).toBe(58);
    expect(diary.json().userId).toBe("single-user");
  });

  it("rejects protected endpoints without a bearer token", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/cri/current" });
    expect(response.statusCode).toBe(401);
  });

  it("routes the authenticated manual Job Opportunity CRUD", async () => {
    const payload = {
      title: "Senior QA Engineer",
      company: "Example Labs",
      country: "Portugal",
      workModel: "remote",
      seniority: "Senior",
      language: "English",
      originalDescription: "Own the quality strategy."
    };
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/job-opportunities",
      headers: { authorization },
      payload
    });
    const listed = await app.inject({
      method: "GET",
      url: "/api/v1/job-opportunities?status=saved&favorite=true",
      headers: { authorization }
    });
    const updated = await app.inject({
      method: "PATCH",
      url: "/api/v1/job-opportunities/job-1",
      headers: { authorization },
      payload: { status: "applied" }
    });
    const removed = await app.inject({
      method: "DELETE",
      url: "/api/v1/job-opportunities/job-1",
      headers: { authorization }
    });

    expect([created.statusCode, listed.statusCode, updated.statusCode, removed.statusCode]).toEqual([201, 200, 200, 204]);
    expect(created.json()).toMatchObject({ id: "job-1", userId: "single-user" });
    expect(jobsService.list).toHaveBeenCalledWith("single-user", expect.objectContaining({ status: "saved", favorite: true }));
  });

  it("routes structured analysis for an owned job opportunity", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/jobs/job-1/analyze",
      headers: { authorization }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ id: "analysis-1", opportunityId: "job-1" });
    expect(jobAnalysisService.analyze).toHaveBeenCalledWith("single-user", "job-1");
  });

  it("routes the authenticated manual Job Application CRUD", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/job-applications",
      headers: { authorization },
      payload: { opportunityId: "job-1", status: "applied", appliedAt: "2026-08-27" }
    });
    const listed = await app.inject({
      method: "GET",
      url: "/api/v1/job-applications?status=applied&search=Example",
      headers: { authorization }
    });
    const updated = await app.inject({
      method: "PATCH",
      url: "/api/v1/job-applications/application-1",
      headers: { authorization },
      payload: { status: "interview", nextAction: "Prepare examples" }
    });
    const removed = await app.inject({
      method: "DELETE",
      url: "/api/v1/job-applications/application-1",
      headers: { authorization }
    });

    expect([created.statusCode, listed.statusCode, updated.statusCode, removed.statusCode]).toEqual([201, 200, 200, 204]);
    expect(created.json()).toMatchObject({ id: "application-1", userId: "single-user", status: "applied" });
    expect(applicationsService.list).toHaveBeenCalledWith("single-user", { search: "Example", status: "applied" });
  });
});
