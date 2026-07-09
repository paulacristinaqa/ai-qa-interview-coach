import { Controller, Headers, Param, Post } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { FeedbackService } from "./feedback.service";

@Controller("feedback")
export class FeedbackController {
  constructor(
    private readonly authService: AuthService,
    private readonly feedbackService: FeedbackService
  ) {}

  @Post("sessions/:sessionId")
  generate(@Headers("authorization") authorization: string | undefined, @Param("sessionId") sessionId: string) {
    this.authService.getUserFromAuthorization(authorization);
    return this.feedbackService.generate(sessionId);
  }
}
