import { Module } from "@nestjs/common";
import { AiGateway } from "./ai/ai-gateway.service";
import { MockAiProvider } from "./ai/mock-ai.provider";
import { OllamaAiProvider } from "./ai/ollama-ai.provider";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { CriController } from "./cri/cri.controller";
import { CriService } from "./cri/cri.service";
import { DashboardController } from "./dashboard/dashboard.controller";
import { DashboardService } from "./dashboard/dashboard.service";
import { DatabaseBootstrap } from "./database/database.bootstrap";
import { PrismaService } from "./database/prisma.service";
import { DiaryController } from "./diary/diary.controller";
import { DiaryService } from "./diary/diary.service";
import { FeedbackController } from "./feedback/feedback.controller";
import { FeedbackService } from "./feedback/feedback.service";
import { GrillMeController } from "./grill-me/grill-me.controller";
import { GrillMeService } from "./grill-me/grill-me.service";
import { HealthController } from "./health/health.controller";
import { InterviewsController } from "./interviews/interviews.controller";
import { InterviewsService } from "./interviews/interviews.service";
import { KnowledgeController } from "./knowledge/knowledge.controller";
import { KnowledgeService } from "./knowledge/knowledge.service";
import { JobsController } from "./jobs/jobs.controller";
import { JobsService } from "./jobs/jobs.service";
import { JobAnalysisController } from "./jobs/job-analysis.controller";
import { JobAnalysisService } from "./jobs/job-analysis.service";
import { LearningController } from "./learning/learning.controller";
import { LearningService } from "./learning/learning.service";
import { QuestionsController } from "./questions/questions.controller";
import { QuestionsService } from "./questions/questions.service";
import { TechnicalLabController } from "./technical-lab/technical-lab.controller";
import { TechnicalLabService } from "./technical-lab/technical-lab.service";

@Module({
  controllers: [
    HealthController,
    AuthController,
    DashboardController,
    InterviewsController,
    FeedbackController,
    GrillMeController,
    QuestionsController,
    LearningController,
    TechnicalLabController,
    KnowledgeController,
    CriController,
    DiaryController,
    JobsController,
    JobAnalysisController
  ],
  providers: [
    PrismaService,
    DatabaseBootstrap,
    MockAiProvider,
    { provide: OllamaAiProvider, useFactory: () => new OllamaAiProvider() },
    AiGateway,
    AuthService,
    DashboardService,
    InterviewsService,
    FeedbackService,
    GrillMeService,
    QuestionsService,
    LearningService,
    TechnicalLabService,
    KnowledgeService,
    CriService,
    DiaryService,
    JobsService,
    JobAnalysisService
  ]
})
export class AppModule {}
