import { Body, Controller, Headers, Param, Post } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { GrillMeService } from "./grill-me.service";
import { StartGrillMeRequest, SubmitGrillMeAnswerRequest } from "./grill-me.types";

@Controller("grill-me")
export class GrillMeController {
  constructor(
    private readonly authService: AuthService,
    private readonly grillMeService: GrillMeService
  ) {}

  @Post("sessions")
  start(@Headers("authorization") authorization: string | undefined, @Body() request: StartGrillMeRequest) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.grillMeService.start(user.id, request);
  }

  @Post("sessions/:sessionId/answers")
  answer(
    @Headers("authorization") authorization: string | undefined,
    @Param("sessionId") sessionId: string,
    @Body() request: SubmitGrillMeAnswerRequest
  ) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.grillMeService.answer(user.id, sessionId, request);
  }
}
