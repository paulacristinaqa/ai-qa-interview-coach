import { BadRequestException, Body, Controller, Delete, Get, Headers, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { CompaniesService } from "./companies.service";
import { CreateCompanyContactRequest, CreateCompanyRequest, UpdateCompanyContactRequest, UpdateCompanyRequest } from "./companies.types";

@Controller("companies")
export class CompaniesController {
  constructor(private readonly authService: AuthService, private readonly companiesService: CompaniesService) {}

  @Get()
  list(@Headers("authorization") authorization: string | undefined, @Query("search") search?: string, @Query("favorite") favorite?: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.companiesService.list(user.id, { search, favorite: optionalBooleanQuery(favorite) });
  }

  @Get(":companyId")
  get(@Headers("authorization") authorization: string | undefined, @Param("companyId") companyId: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.companiesService.get(user.id, companyId);
  }

  @Post()
  create(@Headers("authorization") authorization: string | undefined, @Body() body: CreateCompanyRequest) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.companiesService.create(user.id, body);
  }

  @Patch(":companyId")
  update(@Headers("authorization") authorization: string | undefined, @Param("companyId") companyId: string, @Body() body: UpdateCompanyRequest) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.companiesService.update(user.id, companyId, body);
  }

  @Delete(":companyId")
  @HttpCode(204)
  async remove(@Headers("authorization") authorization: string | undefined, @Param("companyId") companyId: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    await this.companiesService.remove(user.id, companyId);
  }

  @Post(":companyId/contacts")
  createContact(@Headers("authorization") authorization: string | undefined, @Param("companyId") companyId: string, @Body() body: CreateCompanyContactRequest) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.companiesService.createContact(user.id, companyId, body);
  }

  @Patch(":companyId/contacts/:contactId")
  updateContact(@Headers("authorization") authorization: string | undefined, @Param("companyId") companyId: string, @Param("contactId") contactId: string, @Body() body: UpdateCompanyContactRequest) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.companiesService.updateContact(user.id, companyId, contactId, body);
  }

  @Delete(":companyId/contacts/:contactId")
  @HttpCode(204)
  async removeContact(@Headers("authorization") authorization: string | undefined, @Param("companyId") companyId: string, @Param("contactId") contactId: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    await this.companiesService.removeContact(user.id, companyId, contactId);
  }
}

function optionalBooleanQuery(value?: string) {
  if (value === undefined) return undefined;
  if (value !== "true" && value !== "false") throw new BadRequestException("favorite query must be true or false");
  return value === "true";
}
