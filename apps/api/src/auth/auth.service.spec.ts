import { UnauthorizedException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  it("authenticates the configured single user and resolves bearer token", () => {
    const service = new AuthService();

    const response = service.login({
      email: "paula@example.com",
      password: "change-me-locally"
    });

    expect(response.user.email).toBe("paula@example.com");
    expect(response.accessToken).toContain(".");
    expect(service.getUserFromAuthorization(`Bearer ${response.accessToken}`).id).toBe("single-user");
  });

  it("rejects invalid credentials", () => {
    const service = new AuthService();

    expect(() =>
      service.login({
        email: "paula@example.com",
        password: "wrong"
      })
    ).toThrow(UnauthorizedException);
  });

  it("uses configured user values from environment", () => {
    process.env.SINGLE_USER_NAME = "QA Local";
    process.env.SINGLE_USER_EMAIL = "qa@example.com";
    process.env.SINGLE_USER_PASSWORD = "secret";
    process.env.SINGLE_USER_LOCALE = "en";

    const service = new AuthService();
    const response = service.login({ email: "qa@example.com", password: "secret" });

    expect(response.user.name).toBe("QA Local");
    expect(response.user.locale).toBe("en");

    delete process.env.SINGLE_USER_NAME;
    delete process.env.SINGLE_USER_EMAIL;
    delete process.env.SINGLE_USER_PASSWORD;
    delete process.env.SINGLE_USER_LOCALE;
  });

  it("rejects missing bearer token", () => {
    const service = new AuthService();

    expect(() => service.getUserFromAuthorization()).toThrow(UnauthorizedException);
  });
});
