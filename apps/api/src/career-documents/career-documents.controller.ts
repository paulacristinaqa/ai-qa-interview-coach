import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Post, Query } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { CareerDocumentsService } from "./career-documents.service";
import { GenerateCareerDocumentRequest } from "./career-documents.types";

@Controller("career-documents")
export class CareerDocumentsController {
  constructor(private readonly authService: AuthService, private readonly documentsService: CareerDocumentsService) {}

  @Get()
  list(@Headers("authorization") authorization: string | undefined, @Query("opportunityId") opportunityId?: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.documentsService.list(user.id, opportunityId);
  }

  @Get(":documentId")
  get(@Headers("authorization") authorization: string | undefined, @Param("documentId") documentId: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.documentsService.get(user.id, documentId);
  }

  @Post("generate")
  generate(@Headers("authorization") authorization: string | undefined, @Body() body: GenerateCareerDocumentRequest) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.documentsService.generate(user.id, body);
  }

  @Delete(":documentId")
  @HttpCode(204)
  async remove(@Headers("authorization") authorization: string | undefined, @Param("documentId") documentId: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    await this.documentsService.remove(user.id, documentId);
  }
}
