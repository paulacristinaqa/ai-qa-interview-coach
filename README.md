# AI QA Interview Coach

Aplicacao pessoal para treino de entrevistas tecnicas e comportamentais de QA, com foco especial em entrevistas em ingles, evolucao gradual por evidencias e apoio de IA em modo coach.

## Stack

- Web: Next.js, React e TypeScript.
- API: NestJS, TypeScript e Fastify.
- Banco: PostgreSQL.
- ORM: Prisma.
- Execucao local: Docker Compose.
- Testes: Vitest e verificacao TypeScript.

## Estrutura

```text
apps/
  api/
    prisma/
    src/
  web/
    src/
docs/
  adr/
  api/
  architecture/
  product/
```

## Passo a Passo Para Rodar

### 1. Preparar variaveis de ambiente

Copie `.env.example` para `.env` na raiz do projeto.

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

No macOS/Linux:

```bash
cp .env.example .env
```

As credenciais locais padrao sao:

- Email: `paula@example.com`
- Senha: `change-me-locally`

### 2. Instalar dependencias

No Windows, prefira `npm.cmd` para evitar bloqueio de politica de execucao do PowerShell:

```powershell
npm.cmd install
```

No macOS/Linux:

```bash
npm install
```

### 3. Subir o banco PostgreSQL

Com Docker Desktop aberto:

```powershell
docker compose up -d postgres
```

O banco local esperado e:

- Host: `localhost`
- Porta: `5432`
- Database: `etqa_interview_coach`
- Usuario: `etqa`
- Senha: `etqa_password`

Se o comando `docker` nao existir no terminal, abra/instale o Docker Desktop ou suba um PostgreSQL manualmente com esses mesmos dados.

### 4. Gerar Prisma Client

```powershell
npm.cmd run prisma:generate
```

### 5. Aplicar migracoes

```powershell
npm.cmd run prisma:migrate
```

Esse comando cria as tabelas do MVP: usuarios, entrevistas, feedbacks, banco de perguntas, tentativas, laboratorio tecnico, knowledge base, CRI e diary.

### 6. Rodar a aplicacao

Opcao A: rodar API e Web juntos.

```powershell
npm.cmd run dev
```

Opcao B: rodar em dois terminais separados.

Terminal 1:

```powershell
npm.cmd run dev:api
```

Terminal 2:

```powershell
npm.cmd run dev:web
```

URLs locais:

- Web: `http://localhost:3000`
- API health check: `http://localhost:3001/api/v1/health`
- API readiness com banco: `http://localhost:3001/api/v1/health/readiness`

### 7. Entrar no MVP

Abra `http://localhost:3000` e use:

- Email: `paula@example.com`
- Senha: `change-me-locally`

Ao iniciar a API, o bootstrap cria automaticamente o usuario local, perguntas iniciais e desafios tecnicos se ainda nao existirem no banco.

## Funcionalidades Disponiveis

### Login

Permite acessar o MVP com o usuario local configurado no `.env`.

Endpoints:

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Dashboard

Mostra uma visao inicial da candidata, incluindo CRI, prontidao para entrevista, competencias e atalhos de treino.

Endpoint:

- `GET /api/v1/dashboard`

### Simulador Textual de Entrevista

Permite iniciar uma entrevista em PT-BR ou ingles, configurar cargo, senioridade, tema e dificuldade, responder perguntas e receber follow-ups.

Endpoints:

- `POST /api/v1/interviews`
- `GET /api/v1/interviews/:sessionId`
- `POST /api/v1/interviews/:sessionId/answers`
- `POST /api/v1/interviews/:sessionId/complete`

### Feedback Estruturado

Depois de finalizar uma entrevista, gera um feedback por dimensoes, com resumo, nivel de confianca, evidencias e recomendacoes acionaveis.

Endpoint:

- `POST /api/v1/feedback/sessions/:sessionId`

### Banco de Perguntas Nivelado

Fornece perguntas de entrevista por tema, nivel, idioma e competencia. O MVP seleciona a proxima pergunta de forma deterministica com base no historico de desempenho.

Endpoints:

- `GET /api/v1/questions/next`
- `POST /api/v1/questions/:questionId/attempts`

### Guided Learning

Oferece ajuda progressiva antes de entregar uma resposta completa. A usuaria pode pedir dica ou exemplo e tentar novamente.

Endpoint:

- `POST /api/v1/learning/hint`

### Technical Lab

Disponibiliza desafios tecnicos com contexto, criterios de avaliacao, tentativa da usuaria, feedback e solucao modelo liberada por acao explicita.

Endpoints:

- `GET /api/v1/technical-lab/challenges`
- `POST /api/v1/technical-lab/challenges/:challengeId/attempts`
- `POST /api/v1/technical-lab/challenges/:challengeId/reveal`

### Knowledge Base e Historico

Permite registrar notas e aprendizados, consultar itens salvos, ver historico consolidado de entrevistas/tentativas/desafios e exportar conteudo em Markdown.

Endpoints:

- `GET /api/v1/knowledge`
- `POST /api/v1/knowledge`
- `PATCH /api/v1/knowledge/:itemId`
- `GET /api/v1/knowledge/history`
- `GET /api/v1/knowledge/export`

### Career Readiness Index

Recalcula o indice de prontidao de carreira com base em tentativas do banco de perguntas, feedback de entrevistas e Technical Lab. O resultado inclui score, nivel de confianca, composicao e lacunas de evidencia.

Endpoint:

- `GET /api/v1/cri/current`

### Developer Diary

Permite registrar decisoes, contexto, proximos passos e exportar o diario em Markdown. Serve como base de portfolio e rastreio de evolucao do projeto.

Endpoints:

- `GET /api/v1/diary/entries`
- `POST /api/v1/diary/entries`
- `PATCH /api/v1/diary/entries/:entryId`
- `GET /api/v1/diary/export`

## Fluxo Sugerido Para QA Manual

1. Entrar com o usuario local.
2. Verificar se o dashboard carrega.
3. Iniciar uma entrevista textual.
4. Responder duas ou tres perguntas.
5. Finalizar a entrevista.
6. Gerar feedback estruturado.
7. Buscar uma pergunta nivelada.
8. Pedir dica ou exemplo no Guided Learning.
9. Responder a pergunta e verificar o resultado.
10. Abrir um desafio do Technical Lab.
11. Enviar uma solucao e depois revelar a solucao modelo.
12. Criar uma nota na Knowledge Base.
13. Carregar historico.
14. Recalcular o CRI.
15. Criar uma entrada no Developer Diary.
16. Exportar Knowledge Base ou Diary em Markdown.

## Scripts

- `npm.cmd run dev`: inicia API e Web em modo desenvolvimento.
- `npm.cmd run dev:api`: inicia apenas a API.
- `npm.cmd run dev:web`: inicia apenas a Web.
- `npm.cmd run build`: compila API e Web.
- `npm.cmd run lint`: roda verificacao TypeScript nos workspaces.
- `npm.cmd run test`: roda testes dos workspaces.
- `npm.cmd run prisma:generate`: gera Prisma Client.
- `npm.cmd run prisma:migrate`: aplica migracoes no banco local.

Em macOS/Linux, os mesmos comandos podem ser usados com `npm` no lugar de `npm.cmd`.

## Problemas Comuns

### `npm.ps1 nao pode ser carregado`

No Windows PowerShell, use `npm.cmd`:

```powershell
npm.cmd run dev
```

### `docker nao e reconhecido`

Abra o Docker Desktop e tente novamente. Se ainda falhar, confirme se o Docker esta no PATH ou rode um PostgreSQL manualmente com as credenciais deste README.

### `Prisma cannot reach database`

Confirme se o PostgreSQL esta rodando em `localhost:5432` e se o `DATABASE_URL` do `.env` aponta para:

```text
postgresql://etqa:etqa_password@localhost:5432/etqa_interview_coach?schema=public
```

### Frontend nao conecta na API

Confirme se a API esta em `http://localhost:3001/api/v1` e se o `.env` contem:

```text
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001/api/v1
```
