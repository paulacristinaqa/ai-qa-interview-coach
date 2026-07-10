import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { KnowledgeService } from "./knowledge.service";

@Controller("knowledge")
export class KnowledgeController {
  constructor(
    private readonly authService: AuthService,
    private readonly knowledgeService: KnowledgeService
  ) {}

  @Get()
  list(
    @Headers("authorization") authorization: string | undefined,
    @Query("search") search?: string,
    @Query("type") type?: string,
    @Query("tag") tag?: string
  ) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.knowledgeService.list(user.id, { search, type, tag });
  }

  @Get("history")
  history(@Headers("authorization") authorization: string | undefined) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.knowledgeService.history(user.id);
  }

  @Get("export")
  export(@Headers("authorization") authorization: string | undefined) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.knowledgeService.exportMarkdown(user.id);
  }

  @Post()
  create(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: { type: string; title: string; body: string; tags?: string[]; source?: string }
  ) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.knowledgeService.create(user.id, body);
  }

  @Patch(":itemId")
  update(
    @Headers("authorization") authorization: string | undefined,
    @Param("itemId") itemId: string,
    @Body() body: { title?: string; body?: string; tags?: string[] }
  ) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.knowledgeService.update(user.id, itemId, body);
  }
}
