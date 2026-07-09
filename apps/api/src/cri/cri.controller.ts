import { Controller, Get, Headers } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { CriService } from "./cri.service";

@Controller("cri")
export class CriController {
  constructor(
    private readonly authService: AuthService,
    private readonly criService: CriService
  ) {}

  @Get("current")
  current(@Headers("authorization") authorization: string | undefined) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.criService.current(user.id);
  }
}
