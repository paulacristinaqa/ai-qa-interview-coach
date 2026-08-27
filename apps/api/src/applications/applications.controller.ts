import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { ApplicationsService } from "./applications.service";
import { ApplicationStatus, CreateJobApplicationRequest, UpdateJobApplicationRequest } from "./applications.types";

@Controller("job-applications")
export class ApplicationsController {
  constructor(private readonly authService: AuthService, private readonly applicationsService: ApplicationsService) {}

  @Get()
  list(
    @Headers("authorization") authorization: string | undefined,
    @Query("search") search?: string,
    @Query("status") status?: ApplicationStatus
  ) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.applicationsService.list(user.id, { search, status });
  }

  @Get(":applicationId")
  get(@Headers("authorization") authorization: string | undefined, @Param("applicationId") applicationId: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.applicationsService.get(user.id, applicationId);
  }

  @Post()
  create(@Headers("authorization") authorization: string | undefined, @Body() body: CreateJobApplicationRequest) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.applicationsService.create(user.id, body);
  }

  @Patch(":applicationId")
  update(
    @Headers("authorization") authorization: string | undefined,
    @Param("applicationId") applicationId: string,
    @Body() body: UpdateJobApplicationRequest
  ) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.applicationsService.update(user.id, applicationId, body);
  }

  @Delete(":applicationId")
  @HttpCode(204)
  async remove(@Headers("authorization") authorization: string | undefined, @Param("applicationId") applicationId: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    await this.applicationsService.remove(user.id, applicationId);
  }
}
