# Validacao de saude tecnica local

Tipo: changelog

Data: 2026-07-13

## Contexto

Foi executada uma revisao do fluxo de setup antes de novas funcionalidades. O ambiente avaliado usa Windows, Node.js 20.12.2 e npm 10.5.0. Nao havia Docker instalado nem PostgreSQL ativo em `localhost:5432`.

## Estado encontrado

- A instalacao inicial de dependencias estava ausente.
- O `.env.example` nao declarava `DATABASE_URL`, embora o Prisma dependa dela.
- Os comandos Prisma eram executados no workspace da API e, por isso, nao carregavam o `.env` da raiz.
- Vitest 4.1.9 dependia de uma versao do Vite/Rolldown incompatível com o Node 20.12.2 disponivel e falhava antes de iniciar os testes.
- Nao havia comando explicito de seed; a carga idempotente ocorria somente durante a inicializacao da API.
- A API falhava no startup porque a geracao das perguntas usava `supplementalAngles` antes da inicializacao da constante.
- O comando chamado `lint` corresponde atualmente a `tsc --noEmit`; nao ha ESLint configurado.

## Decisoes e correcoes

- Adicionada `DATABASE_URL` ao exemplo de ambiente.
- Ajustados os comandos Prisma da raiz para carregar corretamente o `.env` e o schema da API.
- Adicionado comando de seed que reutiliza o bootstrap idempotente existente, sem alterar regras de negocio.
- Corrigida somente a ordem de declaracao dos dados do seed, eliminando a falha de startup sem mudar seu conteudo.
- Adicionado comando explicito de typecheck.
- Fixado Vitest 3.2.7, compativel com o requisito Node 20 e sem o alerta de seguranca presente na 3.2.4.
- Substituido o Next.js canary pela versao estavel 16.3.0 para remover alertas de seguranca sem alterar a aplicacao.
- Atualizado o setup local para incluir seed, typecheck e build.
- Ajustada a CI para usar `prisma migrate deploy`, executar o seed e validar typecheck explicitamente.

## Evidencias

- Dependencias instaladas: 374 pacotes auditados, 0 vulnerabilidades.
- Prisma Client 5.22.0 gerado com sucesso.
- TypeScript/lint: aprovado nos workspaces API e Web.
- Testes da API: 5 arquivos e 9 testes aprovados, incluindo uma regressao para o carregamento do catalogo do seed.
- Testes do Web: nenhum arquivo de teste encontrado; o comando conclui com sucesso por configuracao.
- Build da API e do Web: aprovado; a pagina principal foi gerada estaticamente.
- Migrations e seed no banco: nao concluidos neste ambiente porque nao existe PostgreSQL acessivel.

## Proximos riscos

- Reexecutar migrations, seed, readiness e smoke E2E assim que Docker/PostgreSQL estiver disponivel.
- Criar testes para o frontend e ampliar cobertura dos modulos da API ainda sem testes.
- Adotar uma ferramenta de lint dedicada para complementar o typecheck.
