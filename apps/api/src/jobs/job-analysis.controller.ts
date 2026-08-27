import { Controller, Headers, Param, Post } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { JobAnalysisService } from "./job-analysis.service";

@Controller("jobs")
export class JobAnalysisController {
  constructor(private readonly authService: AuthService, private readonly jobAnalysisService: JobAnalysisService) {}

  @Post(":opportunityId/analyze")
  analyze(@Headers("authorization") authorization: string | undefined, @Param("opportunityId") opportunityId: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.jobAnalysisService.analyze(user.id, opportunityId);
  }
}
