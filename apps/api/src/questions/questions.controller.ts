import { Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { QuestionsService } from "./questions.service";

@Controller("questions")
export class QuestionsController {
  constructor(
    private readonly authService: AuthService,
    private readonly questionsService: QuestionsService
  ) {}

  @Get()
  list(
    @Headers("authorization") authorization: string | undefined,
    @Query("topic") topic?: string,
    @Query("language") language?: string,
    @Query("level") level?: string
  ) {
    this.authService.getUserFromAuthorization(authorization);
    return this.questionsService.list({ topic, language, level: level ? Number(level) : undefined });
  }

  @Get("topics")
  topics(@Headers("authorization") authorization: string | undefined) {
    this.authService.getUserFromAuthorization(authorization);
    return this.questionsService.topics();
  }

  @Get("next")
  next(
    @Headers("authorization") authorization: string | undefined,
    @Query("topic") topic?: string,
    @Query("language") language?: string,
    @Query("level") level?: string
  ) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.questionsService.next(user.id, topic, language, level ? Number(level) : undefined);
  }

  @Post(":questionId/attempts")
  attempt(
    @Headers("authorization") authorization: string | undefined,
    @Param("questionId") questionId: string,
    @Body() body: { answer: string; helpUsed?: boolean }
  ) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.questionsService.attempt(user.id, questionId, body.answer, body.helpUsed);
  }
}
