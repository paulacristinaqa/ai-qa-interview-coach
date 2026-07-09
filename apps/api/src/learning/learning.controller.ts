import { Body, Controller, Headers, Post } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { LearningService } from "./learning.service";

@Controller("learning")
export class LearningController {
  constructor(
    private readonly authService: AuthService,
    private readonly learningService: LearningService
  ) {}

  @Post("hint")
  hint(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: { concept: string; helpLevel?: string; sessionId?: string; language?: string }
  ) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.learningService.hint(user.id, body);
  }
}
