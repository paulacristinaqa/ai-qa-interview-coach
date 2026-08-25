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

Por padrao, `AI_PROVIDER=mock`: o projeto funciona sem conta, chave de API ou servico pago. A IA generativa local com Ollama e opcional e esta descrita na secao "IA local com custo zero".

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

- Host: `127.0.0.1`
- Porta no host: `5433`
- Database: `etqa_interview_coach`
- Usuario: `etqa`
- Senha: `etqa_password`

A porta do host e configuravel por `POSTGRES_HOST_PORT`. O container continua usando `5432` internamente; `5433` evita conflito com uma instalacao local do PostgreSQL.

Se o comando `docker` nao existir no terminal, abra/instale o Docker Desktop ou suba um PostgreSQL manualmente com esses mesmos dados.

### 4. Gerar Prisma Client

```powershell
npm.cmd run prisma:generate
```

### 5. Aplicar migracoes

```powershell
npm.cmd run db:wait
npm.cmd run prisma:migrate:deploy
npm.cmd run prisma:migrate:status
npm.cmd run seed
```

Esses comandos aguardam o banco, aplicam as migrations versionadas, confirmam o estado e executam a carga inicial. Para criar uma nova migration durante desenvolvimento, use `npm.cmd run prisma:migrate`.

### 6. Validar o projeto

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

### 7. Rodar a aplicacao

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

### 8. Entrar no MVP

Abra `http://localhost:3000` e use:

- Email: `paula@example.com`
- Senha: `change-me-locally`

Ao iniciar a API, o bootstrap cria automaticamente o usuario local, perguntas iniciais e desafios tecnicos se ainda nao existirem no banco.

### Mapa da interface

Depois do login, a navegacao lateral organiza o MVP por dominio:

| Rota | Area | Estado |
| --- | --- | --- |
| `/dashboard` | Dashboard e Career Readiness Index | Operacional |
| `/interviews` | Entrevistas e feedback estruturado | Operacional |
| `/grill-me` | Treino com pressao e follow-ups | Operacional |
| `/technical-lab` | Guided Learning, perguntas e desafios | Operacional |
| `/knowledge-base` | Notas, historico e exportacao | Operacional |
| `/developer-diary` | Diario, sugestoes e exportacao | Operacional |
| `/settings` | Sessao local e logout | Operacional |
| `/career/jobs` | Job Intelligence Manual | Operacional |
| `/career/applications` | Applications | Rota preparada, sem funcionalidade nesta etapa |
| `/career/companies` | Companies | Rota preparada, sem funcionalidade nesta etapa |
| `/career/documents` | Documents | Rota preparada, sem funcionalidade nesta etapa |

A rota `/` redireciona para `/dashboard`.

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

Permite iniciar uma entrevista em PT-BR ou ingles, configurar cargo, senioridade, tema e dificuldade, responder perguntas, receber follow-ups, salvar respostas e finalizar a sessao. A tela mostra o historico da conversa com botoes claros para responder, finalizar e gerar feedback.

Endpoints:

- `POST /api/v1/interviews`
- `GET /api/v1/interviews/:sessionId`
- `POST /api/v1/interviews/:sessionId/answers`
- `POST /api/v1/interviews/:sessionId/complete`

### Grill Me

Modo de entrevista tecnica por tema, idioma, nivel e pressao. Os idiomas disponiveis agora sao Portugues e Ingles. Os temas iniciais seedados sao API Testing, SQL, Test Design, Automation, Behavioral e Agile/QA Process. Os niveis sao basic, intermediate e advanced. Os modos sao standard, light-pressure e realistic.

Endpoints:

- `POST /api/v1/grill-me/sessions`
- `POST /api/v1/grill-me/sessions/:sessionId/answers`

### Feedback Estruturado

Depois de finalizar uma entrevista, gera um feedback por dimensoes, com resumo, nivel de confianca, evidencias e recomendacoes acionaveis. Para sessoes em ingles, inclui naturalidade, vocabulario tecnico e sugestoes de frases de entrevista.

Endpoint:

- `POST /api/v1/feedback/sessions/:sessionId`

### IA local com custo zero

O MVP usa respostas deterministicas com `AI_PROVIDER=mock` por padrao. Esse modo e suficiente para desenvolver, testar e executar todo o fluxo sem custo de API.

Para obter respostas generativas sem enviar entrevistas ou dados de carreira para um provedor externo, instale o [Ollama para Windows](https://docs.ollama.com/windows) e baixe o modelo compacto recomendado:

```powershell
ollama pull qwen3:4b
```

O modelo ocupa aproximadamente 2,5 GB em disco. A configuracao foi escolhida para uma maquina com 32 GB de memoria e sem GPU dedicada confirmada. Depois do download, altere apenas estas variaveis no `.env`:

```text
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:4b
OLLAMA_TIMEOUT_MS=45000
OLLAMA_KEEP_ALIVE=5m
```

Reinicie a API. O Ollama atende localmente em `http://127.0.0.1:11434` e nao requer chave para uso local. A integracao cobre:

- perguntas iniciais e follow-ups de Interview;
- feedback estruturado das respostas;
- explicacoes do Guided Learning;
- perguntas iniciais e follow-ups do Grill Me.

As respostas passam por validacao de schema JSON. Se o Ollama nao estiver ativo, exceder o timeout ou retornar uma resposta invalida, o gateway registra apenas metadados tecnicos e usa automaticamente a resposta deterministica. Perguntas, respostas e outros dados informados pela usuaria nao sao escritos nos logs da IA.

Para voltar ao modo sem modelo:

```text
AI_PROVIDER=mock
```

O uso local nao tem cobranca por requisicao, mas consome recursos do computador, energia e espaco em disco. O projeto nao depende de OpenAI API nem de outro servico de IA pago.

### Prompt Templates versionados

Todos os pedidos enviados ao AI Gateway sao criados por um registry central em `apps/api/src/ai/prompts`. Os templates estao separados por dominio:

- Interview;
- Guided Learning;
- Grill Me;
- Technical Lab;
- Career.

Cada template declara identificador, versao semantica, objetivo, entradas esperadas, formato de saida, schema JSON, criterios de avaliacao e regras de seguranca. A versao enviada ao provider usa o formato `dominio.template@major.minor.patch`, por exemplo `interview.feedback@1.0.0`.

Mudancas que possam alterar o comportamento ou o formato da resposta devem criar uma nova versao do template. O provider local recebe o schema junto com o prompt e a API valida novamente o JSON retornado. JSON malformado ou incompativel com o schema nunca e persistido: o gateway retorna ao resultado deterministico.

Os templates de Technical Lab e Career preparam contratos para entregas futuras; sua existencia no registry nao habilita novas funcionalidades nem altera as regras atuais desses modulos.

### Banco de Perguntas Nivelado

Fornece perguntas de entrevista por tema, nivel, idioma e competencia. O MVP seleciona a proxima pergunta de forma deterministica com base no historico de desempenho. O seed inicial gera 708 perguntas: 118 por tema, com criterios de boa resposta, dicas progressivas e resposta modelo.

Endpoints:

- `GET /api/v1/questions`
- `GET /api/v1/questions/topics`
- `GET /api/v1/questions/next`
- `POST /api/v1/questions/:questionId/attempts`

### Guided Learning

Oferece ajuda progressiva antes de entregar uma resposta completa. A usuaria pode pedir dica curta, explicacao, exemplo e resposta modelo. A resposta modelo fica bloqueada ate a pessoa passar por dica, explicacao e exemplo, estimulando raciocinio antes de revelar a resposta completa.

Endpoint:

- `POST /api/v1/learning/hint`

### Technical Lab

Disponibiliza desafios tecnicos com contexto realista de entrevista, criterios de avaliacao, tentativa da usuaria, feedback e solucao modelo liberada por acao explicita. Os desafios cobrem API, SQL, Test Design e Automacao.

Endpoints:

- `GET /api/v1/technical-lab/challenges`
- `POST /api/v1/technical-lab/challenges/:challengeId/attempts`
- `POST /api/v1/technical-lab/challenges/:challengeId/reveal`

### Knowledge Base e Historico

Permite registrar notas e aprendizados, consultar itens salvos, filtrar por busca, tipo ou tag, ver historico consolidado de entrevistas/tentativas/desafios e exportar conteudo em Markdown.

Endpoints:

- `GET /api/v1/knowledge`
- `POST /api/v1/knowledge`
- `PATCH /api/v1/knowledge/:itemId`
- `GET /api/v1/knowledge/history`
- `GET /api/v1/knowledge/export`

### Career Readiness Index

Recalcula o indice de prontidao de carreira com base em tentativas do banco de perguntas, feedback de entrevistas e Technical Lab. O resultado inclui score, nivel de confianca, composicao, lacunas de evidencia e explicacao do motivo do score.

Endpoint:

- `GET /api/v1/cri/current`

### Job Intelligence Manual

Permite cadastrar oportunidades manualmente em `/career/jobs`, sem scraping ou integracoes externas. Cada vaga registra titulo, empresa, pais, cidade, modelo de trabalho, senioridade, idioma, link, descricao original, status, favorito e observacoes.

A tela oferece criacao, listagem, busca, filtros por status, modelo, senioridade e favorito, detalhe, edicao e exclusao. Todas as operacoes sao vinculadas ao usuario autenticado.

Endpoints:

- `GET /api/v1/job-opportunities`
- `GET /api/v1/job-opportunities/:opportunityId`
- `POST /api/v1/job-opportunities`
- `PATCH /api/v1/job-opportunities/:opportunityId`
- `DELETE /api/v1/job-opportunities/:opportunityId`

Os contratos completos estao registrados em `docs/api/openapi.yaml`.

### Developer Diary

Permite registrar decisoes, ADR simples, changelog, future improvements, contexto, proximos passos e exportar o diario em Markdown. Tambem sugere entradas automaticamente com base nas evidencias recentes.

Endpoints:

- `GET /api/v1/diary/entries`
- `POST /api/v1/diary/entries`
- `PATCH /api/v1/diary/entries/:entryId`
- `GET /api/v1/diary/suggestions`
- `GET /api/v1/diary/export`

## Fluxo Sugerido Para QA Manual

1. Entrar com o usuario local.
2. Verificar se o dashboard carrega.
3. Iniciar uma entrevista textual.
4. Responder duas ou tres perguntas.
5. Finalizar a entrevista.
6. Gerar feedback estruturado.
7. Iniciar um Grill Me em Ingles com pressao leve.
8. Responder follow-ups ate a sessao finalizar.
9. Buscar uma pergunta nivelada.
10. Conferir criterios, dicas e resposta modelo.
11. Pedir dica ou exemplo no Guided Learning.
12. Responder a pergunta e verificar o resultado.
13. Abrir um desafio do Technical Lab.
14. Enviar uma solucao e depois revelar a solucao modelo.
15. Criar uma nota na Knowledge Base.
16. Carregar historico.
17. Recalcular o CRI.
18. Criar uma entrada no Developer Diary.
19. Exportar Knowledge Base ou Diary em Markdown.
20. Abrir Career Intelligence > Jobs e cadastrar uma oportunidade manual.
21. Filtrar a oportunidade, abrir o detalhe e editar status ou observacoes.
22. Excluir uma oportunidade de teste e confirmar que ela desaparece da listagem.

## Scripts

- `npm.cmd run dev`: inicia API e Web em modo desenvolvimento.
- `npm.cmd run dev:api`: inicia apenas a API.
- `npm.cmd run dev:web`: inicia apenas a Web.
- `npm.cmd run build`: compila API e Web.
- `npm.cmd run lint`: roda verificacao TypeScript nos workspaces.
- `npm.cmd run typecheck`: confirma os tipos da API e Web.
- `npm.cmd run test`: roda testes dos workspaces.
- `npm.cmd run test:e2e`: roda smoke E2E contra API local ja iniciada.
- `npm.cmd run test:e2e:with-api`: aguarda o PostgreSQL, inicia a API compilada, roda o smoke E2E e encerra a API.
- `npm.cmd run setup:local`: executa install, Prisma Client, PostgreSQL, migrations, seed, lint, typecheck, testes e build.
- `npm.cmd run prisma:generate`: gera Prisma Client.
- `npm.cmd run db:wait`: aguarda o PostgreSQL aceitar consultas.
- `npm.cmd run prisma:migrate`: cria migrations durante desenvolvimento.
- `npm.cmd run prisma:migrate:deploy`: aplica migrations existentes sem prompts interativos.
- `npm.cmd run prisma:migrate:status`: confirma o estado das migrations.
- `npm.cmd run seed`: executa a carga inicial idempotente.

## Qualidade e CI

O projeto inclui GitHub Actions em `.github/workflows/ci.yml` com PostgreSQL de servico, `npm ci`, Prisma generate, readiness, migrations, seed, lint, typecheck, testes, build e smoke E2E.

A suite cobre unitariamente Interview, feedback, Grill Me, Guided Learning, Technical Lab, Knowledge Base, CRI e Developer Diary. Os testes de integracao exercitam autenticacao e os endpoints principais pelo adaptador HTTP do Nest. O smoke E2E confirma o fluxo completo: iniciar entrevista, responder, receber follow-up e feedback, atualizar o CRI e registrar a evidencia no historico e no Developer Diary.

Para smoke E2E local:

1. Execute o build e mantenha o PostgreSQL preparado com migrations e seed.
2. Rode o fluxo gerenciado:

```powershell
npm.cmd run build
npm.cmd run test:e2e:with-api
```

Se a API ja estiver ativa em outro terminal, use somente:

```powershell
npm.cmd run test:e2e
```

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

Confirme se o container esta saudavel com `docker compose ps`, rode `npm.cmd run db:wait` e verifique se o `DATABASE_URL` do `.env` aponta para:

```text
postgresql://etqa:etqa_password@127.0.0.1:5433/etqa_interview_coach?schema=public
```

Se aparecer `port is already allocated` em `5432`, mantenha `POSTGRES_HOST_PORT=5433`. Se aparecer `P1000`, outra instancia esta respondendo na porta configurada ou as credenciais do `.env` nao correspondem ao container.

### Frontend nao conecta na API

Confirme se a API esta em `http://localhost:3001/api/v1` e se o `.env` contem:

```text
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001/api/v1
```

### Ollama nao responde ou a geracao demora

Confirme se o Ollama esta aberto e se o modelo foi baixado:

```powershell
ollama list
```

A primeira resposta pode demorar mais porque o modelo precisa ser carregado na memoria. Enquanto o servico estiver indisponivel, a API continua operacional com fallback deterministico. Use `AI_PROVIDER=mock` para desativar tentativas de geracao local.
