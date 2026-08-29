import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const config = JSON.parse(readFileSync(".devcontainer/devcontainer.json", "utf8"));
const compose = readFileSync(".devcontainer/docker-compose.yml", "utf8");

assert.equal(config.service, "workspace");
assert.equal(config.workspaceFolder, "/workspaces/ai-qa-interview-coach");
assert.deepEqual(config.forwardPorts, [3000]);
assert.equal(config.portsAttributes["3000"].visibility, "private");
assert.match(config.postCreateCommand, /npm ci/);
assert.match(config.postCreateCommand, /prisma:migrate:deploy/);
assert.match(config.postCreateCommand, /npm run seed/);
assert.match(compose, /DATABASE_URL: postgresql:\/\/etqa:etqa_password@postgres:5432\/etqa_interview_coach/);
assert.match(compose, /NEXT_PUBLIC_API_BASE_URL: \/api\/v1/);
assert.match(compose, /AI_PROVIDER: mock/);
assert.match(compose, /condition: service_healthy/);
assert.doesNotMatch(compose, /^\s+ports:/m);
assert.doesNotMatch(compose, /OPENAI_API_KEY/);

console.log("Dev container configuration is valid and uses the zero-cost mock provider.");
