import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import { AuthenticatedUser, AuthResponse, LoginRequest } from "./auth.types";

interface TokenPayload {
  sub: string;
  email: string;
  exp: number;
}

@Injectable()
export class AuthService {
  private readonly user: AuthenticatedUser;
  private readonly passwordHash: string;
  private readonly tokenSecret: string;

  constructor() {
    this.user = {
      id: "single-user",
      name: process.env.SINGLE_USER_NAME ?? "Paula QA Tester",
      email: process.env.SINGLE_USER_EMAIL ?? "paula@example.com",
      locale: "pt-BR"
    };

    this.tokenSecret = process.env.JWT_SECRET ?? "local-development-secret";
    this.passwordHash = this.hashPassword(process.env.SINGLE_USER_PASSWORD ?? "change-me-locally");
  }

  login(request: LoginRequest): AuthResponse {
    if (request.email !== this.user.email || !this.verifyPassword(request.password, this.passwordHash)) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return {
      accessToken: this.signToken({
        sub: this.user.id,
        email: this.user.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8
      }),
      user: this.user
    };
  }

  getUserFromAuthorization(authorization?: string): AuthenticatedUser {
    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const payload = this.verifyToken(authorization.slice("Bearer ".length));
    if (payload.sub !== this.user.id || payload.email !== this.user.email) {
      throw new UnauthorizedException("Invalid token subject");
    }

    return this.user;
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const hash = pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, stored: string): boolean {
    const [salt, storedHash] = stored.split(":");
    const hash = pbkdf2Sync(password, salt, 120000, 32, "sha256");
    return timingSafeEqual(Buffer.from(storedHash, "hex"), hash);
  }

  private signToken(payload: TokenPayload): string {
    const encodedPayload = this.base64Url(JSON.stringify(payload));
    const signature = createHmac("sha256", this.tokenSecret).update(encodedPayload).digest("base64url");
    return `${encodedPayload}.${signature}`;
  }

  private verifyToken(token: string): TokenPayload {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) {
      throw new UnauthorizedException("Malformed token");
    }

    const expectedSignature = createHmac("sha256", this.tokenSecret).update(encodedPayload).digest("base64url");
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new UnauthorizedException("Invalid token signature");
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as TokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException("Expired token");
    }

    return payload;
  }

  private base64Url(value: string): string {
    return Buffer.from(value).toString("base64url");
  }
}

