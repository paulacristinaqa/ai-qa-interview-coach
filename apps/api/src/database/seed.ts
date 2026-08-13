import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { loadLocalEnv } from "../config/load-env";

async function seed() {
  loadLocalEnv();
  const app = await NestFactory.createApplicationContext(AppModule);
  await app.close();
}

void seed().catch((error: unknown) => {
  console.error("Database seed failed", error);
  process.exitCode = 1;
});
