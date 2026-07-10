import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../database/prisma.service";
import {
  InterviewLanguage,
  InterviewSession,
  StartInterviewRequest,
  SubmitAnswerRequest
} from "./interviews.types";

@Injectable()
export class InterviewsService {
  private readonly sessions = new Map<string, InterviewSession>();

  constructor(private readonly prisma?: PrismaService) {}

  async start(request: StartInterviewRequest, userId = "single-user"): Promise<InterviewSession> {
    if (this.prisma) {
      const created = await this.prisma.interviewSession.create({
        data: {
          userId,
          language: request.language,
          targetRole: request.targetRole,
          seniority: request.seniority,
          topic: request.topic,
          difficulty: request.difficulty,
          interviewerStyle: request.interviewerStyle ?? "supportive senior interviewer",
          turns: {
            create: {
              orderIndex: 1,
              question: this.buildOpeningQuestion(request.language, request.topic, request.targetRole, request.seniority)
            }
          }
        },
        include: { turns: { orderBy: { orderIndex: "asc" } } }
      });
      return this.toSession(created);
    }

    const session: InterviewSession = {
      id: randomUUID(),
      language: request.language,
      targetRole: request.targetRole,
      seniority: request.seniority,
      topic: request.topic,
      difficulty: request.difficulty,
      interviewerStyle: request.interviewerStyle ?? "supportive senior interviewer",
      status: "started",
      turns: [
        {
          orderIndex: 1,
          question: this.buildOpeningQuestion(request.language, request.topic, request.targetRole, request.seniority)
        }
      ],
      createdAt: new Date().toISOString()
    };

    this.sessions.set(session.id, session);
    return session;
  }

  async submitAnswer(sessionId: string, request: SubmitAnswerRequest): Promise<InterviewSession> {
    if (this.prisma) {
      const session = await this.prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: { turns: { orderBy: { orderIndex: "asc" } } }
      });
      if (!session) {
        throw new NotFoundException("Interview session not found");
      }

      const currentTurn = session.turns.at(-1);
      if (currentTurn && !currentTurn.answer) {
        await this.prisma.interviewTurn.update({
          where: { id: currentTurn.id },
          data: {
            answer: request.answer,
            coachNote: this.buildCoachNote(session.language as InterviewLanguage, request.answer)
          }
        });
      }

      if (session.turns.length < 4) {
        await this.prisma.interviewTurn.create({
          data: {
            sessionId,
            orderIndex: session.turns.length + 1,
            question: this.buildFollowUpQuestion(
              session.language as InterviewLanguage,
              session.topic,
              request.answer,
              session.turns.length + 1
            )
          }
        });
      }

      return this.get(sessionId);
    }

    const session = await this.get(sessionId);
    const currentTurn = session.turns.at(-1);
    if (currentTurn && !currentTurn.answer) {
      currentTurn.answer = request.answer;
      currentTurn.coachNote = this.buildCoachNote(session.language, request.answer);
    }

    if (session.turns.length < 4) {
      session.turns.push({
        orderIndex: session.turns.length + 1,
        question: this.buildFollowUpQuestion(session.language, session.topic, request.answer, session.turns.length + 1)
      });
    }

    return session;
  }

  async complete(sessionId: string): Promise<InterviewSession> {
    if (this.prisma) {
      const session = await this.prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: "completed", completedAt: new Date() },
        include: { turns: { orderBy: { orderIndex: "asc" } } }
      });
      return this.toSession(session);
    }

    const session = await this.get(sessionId);
    session.status = "completed";
    return session;
  }

  async get(sessionId: string): Promise<InterviewSession> {
    if (this.prisma) {
      const session = await this.prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: { turns: { orderBy: { orderIndex: "asc" } } }
      });
      if (!session) {
        throw new NotFoundException("Interview session not found");
      }
      return this.toSession(session);
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException("Interview session not found");
    }

    return session;
  }

  private toSession(session: {
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
  }): InterviewSession {
    return {
      id: session.id,
      language: session.language as InterviewLanguage,
      targetRole: session.targetRole,
      seniority: session.seniority,
      topic: session.topic,
      difficulty: session.difficulty as InterviewSession["difficulty"],
      interviewerStyle: session.interviewerStyle ?? "supportive senior interviewer",
      status: session.status as InterviewSession["status"],
      createdAt: session.startedAt.toISOString(),
      turns: session.turns.map((turn) => ({
        orderIndex: turn.orderIndex,
        question: turn.question,
        answer: turn.answer ?? undefined,
        coachNote: turn.coachNote ?? undefined
      }))
    };
  }

  private buildOpeningQuestion(
    language: InterviewLanguage,
    topic: string,
    targetRole: string,
    seniority: string
  ): string {
    if (language === "en") {
      return `You are interviewing for a ${seniority} ${targetRole} role. Explain how you would approach ${topic}, using a concrete QA example.`;
    }

    return `Voce esta em uma entrevista para ${targetRole} ${seniority}. Explique como abordaria ${topic}, usando um exemplo concreto de QA.`;
  }

  private buildFollowUpQuestion(language: InterviewLanguage, topic: string, answer: string, orderIndex: number): string {
    const asksForExample = answer.length < 180;

    if (language === "en") {
      return asksForExample
        ? `Could you make that answer more specific with an example, metrics, or trade-offs related to ${topic}?`
        : `Good. Now go deeper: what risks, edge cases, or stakeholder concerns would you mention for ${topic}?`;
    }

    return asksForExample
      ? `Voce pode deixar essa resposta mais especifica com exemplo, metricas ou trade-offs sobre ${topic}?`
      : `Bom. Agora aprofunde: quais riscos, cenarios de borda ou preocupacoes de stakeholders voce citria sobre ${topic}?`;
  }

  private buildCoachNote(language: InterviewLanguage, answer: string): string {
    const tooLong = answer.length > 900;
    if (language === "en") {
      return tooLong
        ? "Your answer is detailed, but it may be too long for an interview. Try a clearer structure: context, action, result, learning."
        : "Good start. Make the next answer sharper: context, action, evidence, trade-off, and result.";
    }

    return tooLong
      ? "A resposta esta detalhada, mas pode estar longa para entrevista. Tente estruturar em contexto, acao, resultado e aprendizado."
      : "Bom inicio. Deixe a proxima resposta mais forte: contexto, acao, evidencia, trade-off e resultado.";
  }
}
