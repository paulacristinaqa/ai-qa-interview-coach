import { BadRequestException, Body, Controller, Delete, Get, Headers, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { JobsService } from "./jobs.service";
import { CreateJobOpportunityRequest, JobStatus, UpdateJobOpportunityRequest, WorkModel } from "./jobs.types";

@Controller("job-opportunities")
export class JobsController {
  constructor(private readonly authService: AuthService, private readonly jobsService: JobsService) {}

  @Get()
  list(
    @Headers("authorization") authorization: string | undefined,
    @Query("search") search?: string,
    @Query("status") status?: JobStatus,
    @Query("workModel") workModel?: WorkModel,
    @Query("seniority") seniority?: string,
    @Query("favorite") favorite?: string
  ) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.jobsService.list(user.id, { search, status, workModel, seniority, favorite: parseFavorite(favorite) });
  }

  @Get(":opportunityId")
  get(@Headers("authorization") authorization: string | undefined, @Param("opportunityId") opportunityId: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.jobsService.get(user.id, opportunityId);
  }

  @Post()
  create(@Headers("authorization") authorization: string | undefined, @Body() body: CreateJobOpportunityRequest) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.jobsService.create(user.id, body);
  }

  @Patch(":opportunityId")
  update(
    @Headers("authorization") authorization: string | undefined,
    @Param("opportunityId") opportunityId: string,
    @Body() body: UpdateJobOpportunityRequest
  ) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.jobsService.update(user.id, opportunityId, body);
  }

  @Delete(":opportunityId")
  @HttpCode(204)
  async remove(@Headers("authorization") authorization: string | undefined, @Param("opportunityId") opportunityId: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    await this.jobsService.remove(user.id, opportunityId);
  }
}

function parseFavorite(value?: string) {
  if (value === undefined) return undefined;
  if (value !== "true" && value !== "false") throw new BadRequestException("favorite must be true or false");
  return value === "true";
}
