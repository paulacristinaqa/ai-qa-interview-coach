import { Body, Controller, Headers, Param, Post } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { CompetencyEvaluationService } from "./competency-evaluation.service";
import { EvaluateCompetenciesRequest } from "./competency-evaluation.types";
import { JobAnalysisService } from "./job-analysis.service";

@Controller("jobs")
export class JobAnalysisController {
  constructor(
    private readonly authService: AuthService,
    private readonly jobAnalysisService: JobAnalysisService,
    private readonly competencyEvaluationService: CompetencyEvaluationService
  ) {}

  @Post(":opportunityId/analyze")
  analyze(@Headers("authorization") authorization: string | undefined, @Param("opportunityId") opportunityId: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.jobAnalysisService.analyze(user.id, opportunityId);
  }

  @Post(":opportunityId/evaluate-competencies")
  evaluateCompetencies(
    @Headers("authorization") authorization: string | undefined,
    @Param("opportunityId") opportunityId: string,
    @Body() body: EvaluateCompetenciesRequest
  ) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.competencyEvaluationService.evaluate(user.id, opportunityId, body);
  }
}
