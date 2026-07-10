import { Body, Controller, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { DiaryService } from "./diary.service";

@Controller("diary")
export class DiaryController {
  constructor(
    private readonly authService: AuthService,
    private readonly diaryService: DiaryService
  ) {}

  @Get("entries")
  list(@Headers("authorization") authorization: string | undefined) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.diaryService.list(user.id);
  }

  @Get("export")
  export(@Headers("authorization") authorization: string | undefined) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.diaryService.exportMarkdown(user.id);
  }

  @Get("suggestions")
  suggestions(@Headers("authorization") authorization: string | undefined) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.diaryService.suggestions(user.id);
  }

  @Post("entries")
  create(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: { entryType: string; title: string; context?: string; decision?: string; nextSteps?: string }
  ) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.diaryService.create(user.id, body);
  }

  @Patch("entries/:entryId")
  update(
    @Headers("authorization") authorization: string | undefined,
    @Param("entryId") entryId: string,
    @Body() body: { title?: string; context?: string; decision?: string; nextSteps?: string }
  ) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.diaryService.update(user.id, entryId, body);
  }
}
