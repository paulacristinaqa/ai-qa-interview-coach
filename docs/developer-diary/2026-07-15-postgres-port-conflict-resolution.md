# 2026-07-15 — Resolucao do conflito local de PostgreSQL

## Estado encontrado

O Docker Desktop estava funcional, mas outro projeto mantinha um PostgreSQL saudavel publicado em `0.0.0.0:5432`. O container `etqa-postgres` nao conseguia publicar a mesma porta. Como consequencia, o Prisma conectava ao banco do outro projeto e retornava erro de autenticacao para o usuario `etqa`.

## Correcao

- O PostgreSQL deste projeto passou a usar a porta configuravel `POSTGRES_HOST_PORT`, com padrao local `5433`.
- O `DATABASE_URL` local e o exemplo passaram a usar `127.0.0.1:5433`, evitando ainda a tentativa IPv6 em `localhost` quando o container esta publicado apenas em IPv4.
- O banco do outro projeto permaneceu ativo e nao foi alterado.

## Validacao real

- Container `etqa-postgres` ativo e saudavel em `127.0.0.1:5433 -> 5432`.
- `db:wait` conectou com sucesso.
- Todas as migrations versionadas foram aplicadas.
- Seed concluido com pelo menos 708 perguntas.
- Lint, typecheck, testes e build concluidos com sucesso.

## Operacao local

```powershell
docker compose up -d postgres
npm.cmd run db:wait
npm.cmd run prisma:migrate:deploy
npm.cmd run seed
```

Para usar outra porta, altere `POSTGRES_HOST_PORT` e mantenha a mesma porta no `DATABASE_URL`.
