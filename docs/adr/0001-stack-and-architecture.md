# ADR 0001 - Stack and Architecture

## Status

Accepted

## Context

The MVP needs a predictable local development setup, a modular codebase, typed contracts, and room to evolve AI providers without coupling product rules to a single vendor.

The product starts as a personal web application, not a SaaS. Microservices would add operational cost without clear benefit for the first release.

## Decision

Use a modular monolith with Clean Architecture boundaries.

Initial stack:

- Frontend: Next.js, React, TypeScript.
- Backend: NestJS, TypeScript.
- Database: PostgreSQL.
- ORM: Prisma.
- API contract: OpenAPI.
- Local runtime: Docker Compose.
- Tests: Vitest for deterministic units, Playwright for critical E2E flows.

## Architecture Rules

- Domain rules must not depend on framework, database, HTTP, or AI provider SDKs.
- Application services orchestrate use cases and ports.
- Infrastructure adapters implement persistence, AI provider calls, logging and external integrations.
- API controllers validate input and call application services.
- AI output must be traceable by prompt template, model, criteria and confidence.

## Consequences

- The first implementation can run locally with a small number of processes.
- The codebase can later split modules if usage grows.
- Provider-specific AI code stays replaceable.
- Additional discipline is required to keep module boundaries clean.

