import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthResponse, LoginRequest } from "./auth.types";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() request: LoginRequest): AuthResponse {
    return this.authService.login(request);
  }

  @Get("me")
  me(@Headers("authorization") authorization?: string) {
    return this.authService.getUserFromAuthorization(authorization);
  }
}

