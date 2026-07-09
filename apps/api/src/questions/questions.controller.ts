import { Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { QuestionsService } from "./questions.service";

@Controller("questions")
export class QuestionsController {
  constructor(
    private readonly authService: AuthService,
    private readonly questionsService: QuestionsService
  ) {}

  @Get("next")
  next(@Headers("authorization") authorization: string | undefined, @Query("topic") topic?: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.questionsService.next(user.id, topic);
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
