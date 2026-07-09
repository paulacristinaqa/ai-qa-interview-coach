import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma?: PrismaService) {}

  @Get()
  check() {
    return {
      status: "ok",
      service: "ai-qa-interview-coach-api"
    };
  }

  @Get("readiness")
  async readiness() {
    if (!this.prisma) {
      return { status: "ok", database: "not-configured" };
    }

    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ok", database: "reachable" };
  }
}
