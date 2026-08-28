import { BadRequestException, Body, Controller, Delete, Get, Headers, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { ProfessionalEvidenceService } from "./professional-evidence.service";
import { CreateEvidenceRequest, EvidenceType, UpdateEvidenceRequest } from "./professional-evidence.types";

@Controller("professional-evidence")
export class ProfessionalEvidenceController {
  constructor(private readonly authService: AuthService, private readonly evidenceService: ProfessionalEvidenceService) {}

  @Get()
  list(@Headers("authorization") authorization: string | undefined, @Query("search") search?: string, @Query("type") type?: EvidenceType, @Query("favorite") favorite?: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.evidenceService.list(user.id, { search, type, favorite: optionalBooleanQuery(favorite) });
  }

  @Get(":evidenceId")
  get(@Headers("authorization") authorization: string | undefined, @Param("evidenceId") evidenceId: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.evidenceService.get(user.id, evidenceId);
  }

  @Post()
  create(@Headers("authorization") authorization: string | undefined, @Body() body: CreateEvidenceRequest) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.evidenceService.create(user.id, body);
  }

  @Patch(":evidenceId")
  update(@Headers("authorization") authorization: string | undefined, @Param("evidenceId") evidenceId: string, @Body() body: UpdateEvidenceRequest) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.evidenceService.update(user.id, evidenceId, body);
  }

  @Delete(":evidenceId")
  @HttpCode(204)
  async remove(@Headers("authorization") authorization: string | undefined, @Param("evidenceId") evidenceId: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    await this.evidenceService.remove(user.id, evidenceId);
  }
}

function optionalBooleanQuery(value?: string) {
  if (value === undefined) return undefined;
  if (value !== "true" && value !== "false") throw new BadRequestException("favorite query must be true or false");
  return value === "true";
}
