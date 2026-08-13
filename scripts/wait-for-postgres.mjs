import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

loadLocalEnv();

const timeoutMs = positiveNumber(process.env.POSTGRES_WAIT_TIMEOUT_MS, 60_000);
const intervalMs = positiveNumber(process.env.POSTGRES_WAIT_INTERVAL_MS, 1_000);
const startedAt = Date.now();
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error("DATABASE_URL is required to wait for PostgreSQL.");

const target = safeDatabaseTarget(databaseUrl);
const probeDatabaseUrl = withProbeTimeouts(databaseUrl);
process.stdout.write(`Waiting for PostgreSQL at ${target} ...\n`);

let lastError;
while (Date.now() - startedAt < timeoutMs) {
  const prisma = new PrismaClient({ datasourceUrl: probeDatabaseUrl });
  try {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    process.stdout.write(`PostgreSQL is ready after ${Date.now() - startedAt}ms.\n`);
    process.exit(0);
  } catch (error) {
    lastError = error;
    await prisma.$disconnect().catch(() => undefined);
    await delay(intervalMs);
  }
}

const reason = lastError instanceof Error ? summarizePrismaError(lastError) : "unknown connection error";
throw new Error(`PostgreSQL did not become ready within ${timeoutMs}ms at ${target}: ${reason}`);

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const value = line.trim();
    if (!value || value.startsWith("#") || !value.includes("=")) continue;
    const [key, ...parts] = value.split("=");
    if (!process.env[key]) process.env[key] = parts.join("=");
  }
}

function safeDatabaseTarget(value) {
  try {
    const url = new URL(value);
    return `${url.hostname}:${url.port || "5432"}/${url.pathname.replace(/^\//, "")}`;
  } catch {
    return "configured DATABASE_URL";
  }
}

function withProbeTimeouts(value) {
  try {
    const url = new URL(value);
    if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "1");
    return url.toString();
  } catch {
    return value;
  }
}

function positiveNumber(value, fallback) {
  const number = Number(value ?? fallback);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function summarizePrismaError(error) {
  const lines = error.message.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const useful = lines.find((line) => /can't reach database|authentication failed|does not exist|timed out/i.test(line));
  return `${error.code ? `${error.code}: ` : ""}${useful ?? lines.at(-1) ?? error.name}`;
}
