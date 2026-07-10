import { Injectable, NotFoundException } from "@nestjs/common";
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
    private readonly questionsService: QuestionsService
  ) {}

  async start(userId: string, request: StartGrillMeRequest) {
    const level = toNumericLevel(request.level);
    const question = await this.questionsService.next(userId, request.topic, request.language, level);
    if (!question) {
      throw new NotFoundException("No grill-me question found for the selected filters");
    }

    const session = await this.prisma.interviewSession.create({
      data: {
        userId,
        language: request.language,
        targetRole: request.targetRole ?? "QA Engineer",
        seniority: request.level,
        topic: request.topic,
        difficulty: request.level,
        interviewerStyle: `grill-me:${request.mode}`,
        turns: {
          create: {
            orderIndex: 1,
            question: buildOpeningPrompt(request.language, request.mode, question.prompt)
          }
        }
      },
      include: { turns: { orderBy: { orderIndex: "asc" } } }
    });

    return {
      mode: request.mode,
      level: request.level,
      sourceQuestion: question,
      session: toGrillSession(session)
    };
  }

  async answer(userId: string, sessionId: string, request: SubmitGrillMeAnswerRequest) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { turns: { orderBy: { orderIndex: "asc" } } }
    });
    if (!session) {
      throw new NotFoundException("Grill Me session not found");
    }

    const mode = resolveMode(session.interviewerStyle);
    const language = session.language as GrillMeLanguage;
    const currentTurn = session.turns.at(-1);
    const question = await this.prisma.question.findFirst({
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
      await this.prisma.interviewTurn.create({
        data: {
          sessionId,
          orderIndex: session.turns.length + 1,
          question: buildFollowUp(language, mode, session.topic, request.answer, session.turns.length + 1)
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
    return { mode, attempt, session: toGrillSession(updated) };
  }
}

function toNumericLevel(level: GrillMeLevel | string) {
  if (level === "advanced") return 3;
  if (level === "intermediate") return 2;
  return 1;
}

function resolveMode(value: string | null): GrillMeMode {
  const mode = value?.replace("grill-me:", "");
  return mode === "light-pressure" || mode === "realistic" ? mode : "standard";
}

function buildOpeningPrompt(language: GrillMeLanguage, mode: GrillMeMode, prompt: string) {
  if (language === "en") {
    return mode === "standard" ? prompt : `${prompt} Answer as if this were a live interview. I will challenge vague points.`;
  }
  return mode === "standard" ? prompt : `${prompt} Responda como em uma entrevista ao vivo. Vou pressionar pontos vagos.`;
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

function buildFollowUp(language: GrillMeLanguage, mode: GrillMeMode, topic: string, answer: string, orderIndex: number) {
  const vague = answer.length < 140;
  if (language === "en") {
    if (mode === "realistic") {
      return vague
        ? `I need a sharper answer. Give me one real ${topic} example, the risk, and how you proved quality.`
        : "Now defend your approach: what could fail, and how would you explain the trade-off to a product manager?";
    }
    if (mode === "light-pressure") {
      return vague
        ? `Be more specific. What evidence would convince you that your ${topic} approach worked?`
        : "Good. What edge case or stakeholder concern would you add?";
    }
    return orderIndex % 2 === 0
      ? `Can you add a concrete example related to ${topic}?`
      : `What risk or trade-off would you mention for ${topic}?`;
  }

  if (mode === "realistic") {
    return vague
      ? `Preciso de uma resposta mais forte. Traga um exemplo real de ${topic}, o risco e como voce provaria qualidade.`
      : "Agora defenda sua abordagem: o que poderia falhar e como explicaria o trade-off para produto?";
  }
  if (mode === "light-pressure") {
    return vague
      ? `Seja mais especifica. Que evidencia provaria que sua abordagem em ${topic} funcionou?`
      : "Bom. Que cenario de borda ou preocupacao de stakeholder voce adicionaria?";
  }
  return orderIndex % 2 === 0
    ? `Voce pode adicionar um exemplo concreto sobre ${topic}?`
    : `Que risco ou trade-off voce citaria para ${topic}?`;
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
