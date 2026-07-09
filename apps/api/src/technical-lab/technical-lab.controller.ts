import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { TechnicalLabService } from "./technical-lab.service";

@Controller("technical-lab")
export class TechnicalLabController {
  constructor(
    private readonly authService: AuthService,
    private readonly technicalLabService: TechnicalLabService
  ) {}

  @Get("challenges")
  list(@Headers("authorization") authorization: string | undefined) {
    this.authService.getUserFromAuthorization(authorization);
    return this.technicalLabService.list();
  }

  @Post("challenges/:challengeId/attempts")
  attempt(
    @Headers("authorization") authorization: string | undefined,
    @Param("challengeId") challengeId: string,
    @Body() body: { answer: string }
  ) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.technicalLabService.attempt(user.id, challengeId, body.answer);
  }

  @Post("challenges/:challengeId/reveal")
  reveal(@Headers("authorization") authorization: string | undefined, @Param("challengeId") challengeId: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.technicalLabService.reveal(user.id, challengeId);
  }
}
