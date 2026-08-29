import { Injectable, NotFoundException } from "@nestjs/common";
import { AiGateway } from "../ai/ai-gateway.service";
import { createPromptRequest } from "../ai/prompts/prompt-template.registry";
import { PrismaService } from "../database/prisma.service";
import { QuestionsService } from "../questions/questions.service";
import {
  GrillMeLanguage,
  GrillMeLevel,
  GrillMeMode,
  StartGrillMeRequest,
  SubmitGrillMeAnswerRequest
} from "./grill-me.types";

const maxTurnsByMode: Record<GrillMeMode, number> = {
  standard: 4,
  "light-pressure": 5,
  realistic: 6
};

@Injectable()
export class GrillMeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionsService: QuestionsService,
    private readonly ai?: AiGateway
  ) {}

  async start(userId: string, request: StartGrillMeRequest) {
    const vacancy = await this.loadVacancy(userId, request.opportunityId);
    const vacancyContext = vacancy ? toVacancyContext(vacancy) : undefined;
    const level = toNumericLevel(request.level);
    const question = request.questionId
      ? await this.questionsService.get(request.questionId)
      : await this.questionsService.next(userId, request.topic, request.language, level);
    if (!question) {
      throw new NotFoundException("No grill-me question found for the selected filters");
    }
    if (question.language !== request.language) throw new NotFoundException("Recommended question not found for the selected language");
    const selectedLevel = request.questionId ? fromNumericLevel(question.level) : request.level;
    const fallbackQuestion = buildOpeningPrompt(request.language, request.mode, question.prompt, vacancyContext);
    const openingQuestion = await this.generateQuestion(
      request.language,
      request.mode,
      question.topic,
      question.prompt,
      fallbackQuestion,
      1,
      vacancyContext
    );

    const session = await this.prisma.interviewSession.create({
      data: {
        userId,
        language: request.language,
        targetRole: vacancy?.title ?? request.targetRole ?? "QA Engineer",
        seniority: selectedLevel,
        topic: question.topic,
        difficulty: selectedLevel,
        interviewerStyle: buildInterviewerStyle(request.mode, vacancy?.id, question.id),
        turns: {
          create: {
            orderIndex: 1,
            question: openingQuestion
          }
        }
      },
      include: { turns: { orderBy: { orderIndex: "asc" } } }
    });

    return {
      mode: request.mode,
      level: selectedLevel,
      sourceQuestion: question,
      jobContext: vacancy ? { id: vacancy.id, title: vacancy.title, company: vacancy.company } : undefined,
      session: toGrillSession(session)
    };
  }

  async answer(userId: string, sessionId: string, request: SubmitGrillMeAnswerRequest) {
    const session = await this.prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
      include: { turns: { orderBy: { orderIndex: "asc" } } }
    });
    if (!session) {
      throw new NotFoundException("Grill Me session not found");
    }
    if (!session.interviewerStyle?.startsWith("grill-me:")) {
      throw new NotFoundException("Grill Me session not found");
    }

    const mode = resolveMode(session.interviewerStyle);
    const opportunityId = resolveOpportunityId(session.interviewerStyle);
    const sourceQuestionId = resolveQuestionId(session.interviewerStyle);
    const vacancy = await this.loadVacancy(userId, opportunityId);
    const vacancyContext = vacancy ? toVacancyContext(vacancy) : undefined;
    const language = session.language as GrillMeLanguage;
    const currentTurn = session.turns.at(-1);
    const question = sourceQuestionId
      ? await this.prisma.question.findUnique({ where: { id: sourceQuestionId } })
      : await this.prisma.question.findFirst({
        where: { topic: session.topic, language, level: toNumericLevel(session.difficulty as GrillMeLevel) },
        orderBy: { createdAt: "asc" }
      });

    let attempt = null;
    if (currentTurn && !currentTurn.answer) {
      await this.prisma.interviewTurn.update({
        where: { id: currentTurn.id },
        data: {
          answer: request.answer,
          coachNote: buildCoachNote(language, mode, request.answer)
        }
      });

      if (question) {
        attempt = await this.questionsService.attempt(userId, question.id, request.answer, request.helpUsed);
      }
    }

    if (session.turns.length < maxTurnsByMode[mode]) {
      const nextOrderIndex = session.turns.length + 1;
      const fallbackQuestion = buildFollowUp(language, mode, session.topic, request.answer, nextOrderIndex, vacancyContext);
      const followUpQuestion = await this.generateQuestion(
        language,
        mode,
        session.topic,
        request.answer,
        fallbackQuestion,
        nextOrderIndex,
        vacancyContext
      );
      await this.prisma.interviewTurn.create({
        data: {
          sessionId,
          orderIndex: nextOrderIndex,
          question: followUpQuestion
        }
      });
    } else {
      await this.prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: "completed", completedAt: new Date() }
      });
    }

    const updated = await this.prisma.interviewSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { turns: { orderBy: { orderIndex: "asc" } } }
    });
    return {
      mode,
      attempt,
      jobContext: vacancy ? { id: vacancy.id, title: vacancy.title, company: vacancy.company } : undefined,
      session: toGrillSession(updated)
    };
  }

  private async loadVacancy(userId: string, opportunityId?: string) {
    if (!opportunityId) return null;
    const vacancy = await this.prisma.jobOpportunity.findFirst({
      where: { id: opportunityId, userId },
      include: { analysis: true }
    });
    if (!vacancy) throw new NotFoundException("Job opportunity not found");
    return vacancy;
  }

  private async generateQuestion(
    language: GrillMeLanguage,
    mode: GrillMeMode,
    topic: string,
    userInput: string,
    fallbackQuestion: string,
    orderIndex: number,
    vacancyContext?: VacancyContext
  ) {
    if (!this.ai) return fallbackQuestion;
    const generated = await this.ai.generate<{ question: string }>(
      createPromptRequest("grill-me.question", {
        language,
        userInput,
        context: { topic, mode, orderIndex, vacancy: vacancyContext }
      }),
      { question: fallbackQuestion }
    );
    return generated.output.question;
  }
}

function toNumericLevel(level: GrillMeLevel | string) {
  if (level === "advanced") return 3;
  if (level === "intermediate") return 2;
  return 1;
}

function resolveMode(value: string | null): GrillMeMode {
  const mode = value?.split(":")[1];
  return mode === "light-pressure" || mode === "realistic" ? mode : "standard";
}

function resolveOpportunityId(value: string | null) {
  return resolveMarker(value, "job");
}

function fromNumericLevel(level: number): GrillMeLevel {
  if (level >= 3) return "advanced";
  if (level === 2) return "intermediate";
  return "basic";
}

function resolveQuestionId(value: string | null) {
  return resolveMarker(value, "question");
}

function resolveMarker(value: string | null, marker: string) {
  return value?.match(new RegExp(`:${marker}:([^:]+)`))?.[1];
}

function buildInterviewerStyle(mode: GrillMeMode, opportunityId: string | undefined, questionId: string) {
  return [`grill-me:${mode}`, opportunityId ? `job:${opportunityId}` : "", `question:${questionId}`].filter(Boolean).join(":");
}

function buildOpeningPrompt(language: GrillMeLanguage, mode: GrillMeMode, prompt: string, vacancy?: VacancyContext) {
  const vacancyFocus = vacancy?.requirements[0] ?? vacancy?.technologies[0];
  const vacancyPrefix = vacancy
    ? language === "en"
      ? `For the ${vacancy.title} role at ${vacancy.company}, use the vacancy requirements as context.${vacancyFocus ? ` Focus especially on ${vacancyFocus}.` : ""} `
      : `Para a vaga de ${vacancy.title} na ${vacancy.company}, use os requisitos da vaga como contexto.${vacancyFocus ? ` Priorize ${vacancyFocus}.` : ""} `
    : "";
  if (language === "en") {
    return vacancyPrefix + (mode === "standard" ? prompt : `${prompt} Answer as if this were a live interview. I will challenge vague points.`);
  }
  return vacancyPrefix + (mode === "standard" ? prompt : `${prompt} Responda como em uma entrevista ao vivo. Vou pressionar pontos vagos.`);
}

function buildCoachNote(language: GrillMeLanguage, mode: GrillMeMode, answer: string) {
  const vague = answer.length < 140;
  if (language === "en") {
    if (vague && mode !== "standard") {
      return "Too vague for this mode. Add a concrete scenario, evidence, trade-off, and what you would do next.";
    }
    return "Good. Keep answers structured: context, action, evidence, trade-off, and result.";
  }

  if (vague && mode !== "standard") {
    return "Resposta vaga para este modo. Adicione cenario concreto, evidencia, trade-off e proximo passo.";
  }
  return "Bom. Mantenha estrutura: contexto, acao, evidencia, trade-off e resultado.";
}

function buildFollowUp(
  language: GrillMeLanguage,
  mode: GrillMeMode,
  topic: string,
  answer: string,
  orderIndex: number,
  vacancy?: VacancyContext
) {
  const vague = answer.length < 140;
  const vacancyFocus = vacancy?.requirements[0] ?? vacancy?.technologies[0] ?? topic;
  if (language === "en") {
    if (mode === "realistic") {
      return vague
        ? `I need a sharper answer. For this role, give me one real ${vacancyFocus} example, the risk, and how you proved quality.`
        : `Now defend your approach for this role: what could fail around ${vacancyFocus}, and how would you explain the trade-off to a product manager?`;
    }
    if (mode === "light-pressure") {
      return vague
        ? `Be more specific. What evidence would convince you that your ${vacancyFocus} approach worked?`
        : `Good. What edge case or stakeholder concern around ${vacancyFocus} would you add?`;
    }
    return orderIndex % 2 === 0
      ? `Can you add a concrete example related to ${vacancyFocus}?`
      : `What risk or trade-off would you mention for ${vacancyFocus}?`;
  }

  if (mode === "realistic") {
    return vague
      ? `Preciso de uma resposta mais forte. Para esta vaga, traga um exemplo real de ${vacancyFocus}, o risco e como voce provaria qualidade.`
      : `Agora defenda sua abordagem para esta vaga: o que poderia falhar em ${vacancyFocus} e como explicaria o trade-off para produto?`;
  }
  if (mode === "light-pressure") {
    return vague
      ? `Seja mais especifica. Que evidencia provaria que sua abordagem em ${vacancyFocus} funcionou?`
      : `Bom. Que cenario de borda ou preocupacao de stakeholder sobre ${vacancyFocus} voce adicionaria?`;
  }
  return orderIndex % 2 === 0
    ? `Voce pode adicionar um exemplo concreto sobre ${vacancyFocus}?`
    : `Que risco ou trade-off voce citaria para ${vacancyFocus}?`;
}

interface VacancyContext {
  title: string;
  company: string;
  seniority: string;
  summary: string;
  requirements: string[];
  technologies: string[];
  gaps: string[];
}

function toVacancyContext(vacancy: {
  title: string;
  company: string;
  seniority: string;
  originalDescription: string;
  analysis: null | {
    technicalSummary: string;
    requiredRequirements: unknown;
    technologies: unknown;
    gaps: unknown;
  };
}): VacancyContext {
  return {
    title: vacancy.title,
    company: vacancy.company,
    seniority: vacancy.seniority,
    summary: vacancy.analysis?.technicalSummary ?? vacancy.originalDescription.slice(0, 1200),
    requirements: stringArray(vacancy.analysis?.requiredRequirements),
    technologies: stringArray(vacancy.analysis?.technologies),
    gaps: stringArray(vacancy.analysis?.gaps)
  };
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 12) : [];
}

function toGrillSession(session: {
  id: string;
  language: string;
  targetRole: string;
  seniority: string;
  topic: string;
  difficulty: string;
  interviewerStyle: string | null;
  status: string;
  startedAt: Date;
  turns: Array<{ orderIndex: number; question: string; answer: string | null; coachNote: string | null }>;
}) {
  return {
    id: session.id,
    language: session.language,
    targetRole: session.targetRole,
    seniority: session.seniority,
    topic: session.topic,
    difficulty: session.difficulty,
    interviewerStyle: session.interviewerStyle,
    status: session.status,
    createdAt: session.startedAt.toISOString(),
    turns: session.turns.map((turn) => ({
      orderIndex: turn.orderIndex,
      question: turn.question,
      answer: turn.answer ?? undefined,
      coachNote: turn.coachNote ?? undefined
    }))
  };
}
