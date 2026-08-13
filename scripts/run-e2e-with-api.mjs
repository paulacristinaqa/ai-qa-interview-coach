import { spawn } from "node:child_process";

const apiBaseUrl = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:3001/api/v1";
const startupTimeoutMs = Number(process.env.E2E_STARTUP_TIMEOUT_MS ?? 60_000);

await runCommand(process.execPath, ["scripts/wait-for-postgres.mjs"], "PostgreSQL readiness check");
const api = spawn(process.execPath, ["apps/api/dist/main.js"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit"
});

let apiExited = false;
let apiStartupError;
api.once("exit", () => { apiExited = true; });
api.once("error", (error) => { apiStartupError = error; });

try {
  await waitForReadiness();
  await runCommand(process.execPath, ["tests/e2e/smoke.mjs"], "Interview E2E smoke");
} finally {
  if (!apiExited) {
    api.kill("SIGTERM");
    const exitedGracefully = await Promise.race([
      new Promise((resolve) => api.once("exit", () => resolve(true))),
      new Promise((resolve) => setTimeout(() => resolve(false), 5_000))
    ]);
    if (!exitedGracefully) api.kill("SIGKILL");
  }
}

async function waitForReadiness() {
  const startedAt = Date.now();
  let lastStatus = "not reachable";
  while (Date.now() - startedAt < startupTimeoutMs) {
    if (apiStartupError) throw apiStartupError;
    if (apiExited) throw new Error("API exited before becoming ready.");
    try {
      const response = await fetch(`${apiBaseUrl}/health/readiness`);
      lastStatus = `${response.status} ${await response.text()}`;
      if (response.ok) {
        process.stdout.write(`API readiness confirmed after ${Date.now() - startedAt}ms.\n`);
        return;
      }
    } catch (error) {
      lastStatus = error instanceof Error ? error.message : "request failed";
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`API did not become ready within ${startupTimeoutMs}ms: ${lastStatus}. Run 'npm run db:wait' and verify migrations.`);
}

async function runCommand(command, args, description) {
  const child = spawn(command, args, { cwd: process.cwd(), env: process.env, stdio: "inherit" });
  const exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
  if (exitCode !== 0) throw new Error(`${description} failed with exit code ${exitCode}.`);
}
