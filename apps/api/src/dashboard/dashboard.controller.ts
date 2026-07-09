import { Controller, Get, Headers } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(
    private readonly authService: AuthService,
    private readonly dashboardService: DashboardService
  ) {}

  @Get()
  getDashboard(@Headers("authorization") authorization?: string) {
    const user = this.authService.getUserFromAuthorization(authorization);
    return this.dashboardService.getDashboard(user);
  }
}

