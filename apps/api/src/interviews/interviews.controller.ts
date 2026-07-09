import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { InterviewsService } from "./interviews.service";
import { StartInterviewRequest, SubmitAnswerRequest } from "./interviews.types";

@Controller("interviews")
export class InterviewsController {
  constructor(
    private readonly authService: AuthService,
    private readonly interviewsService: InterviewsService
  ) {}

  @Post()
  async start(@Headers("authorization") authorization: string | undefined, @Body() request: StartInterviewRequest) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.interviewsService.start(request, user.id);
  }

  @Get(":sessionId")
  async get(@Headers("authorization") authorization: string | undefined, @Param("sessionId") sessionId: string) {
    this.authService.getUserFromAuthorization(authorization);
    return this.interviewsService.get(sessionId);
  }

  @Post(":sessionId/answers")
  submitAnswer(
    @Headers("authorization") authorization: string | undefined,
    @Param("sessionId") sessionId: string,
    @Body() request: SubmitAnswerRequest
  ) {
    this.authService.getUserFromAuthorization(authorization);
    return this.interviewsService.submitAnswer(sessionId, request);
  }

  @Post(":sessionId/complete")
  async complete(@Headers("authorization") authorization: string | undefined, @Param("sessionId") sessionId: string) {
    this.authService.getUserFromAuthorization(authorization);
    return this.interviewsService.complete(sessionId);
  }
}
