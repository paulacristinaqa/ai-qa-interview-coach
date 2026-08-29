# AI QA Interview Coach

Aplicacao pessoal para treino de entrevistas tecnicas e comportamentais de QA, com foco especial em entrevistas em ingles, evolucao gradual por evidencias e apoio de IA em modo coach.

Para instalar o projeto em outra maquina, conhecer os fluxos da interface e consultar procedimentos do dia a dia, use o [Manual de Utilizacao](docs/manual-de-utilizacao.md).

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

## Desenvolvimento remoto com custo controlado

O repositorio inclui `.devcontainer/` para abrir o projeto no GitHub Codespaces pelo navegador. O ambiente cria Node.js 20 e PostgreSQL 16, aplica migrations, executa o seed e usa `AI_PROVIDER=mock`; nenhuma chave de IA ou banco pago e necessaria.

1. No GitHub, abra `Code` > `Codespaces` > `Create codespace on main`.
2. Aguarde o setup automatico terminar.
3. No terminal do Codespace, execute `npm run dev`.
4. A porta privada `3000` sera aberta; entre com as credenciais locais padrao.

A Web usa `NEXT_PUBLIC_API_BASE_URL=/api/v1` e encaminha essas chamadas internamente para `API_INTERNAL_BASE_URL`. Isso evita expor a API em outra porta e funciona tanto localmente quanto no Codespace. Um `.env` antigo com a URL absoluta continua aceito, mas pode ser atualizado para esses valores.

Contas pessoais GitHub Free incluem atualmente 120 core-hours e 15 GB-mes de Codespaces. Para impedir cobranca, nao cadastre forma de pagamento ou configure um budget com bloqueio ao atingir o limite. Pare o Codespace ao terminar: fechar apenas a aba nao o interrompe imediatamente. Reabra sempre o mesmo Codespace para manter o PostgreSQL; exclui-lo remove esse banco de desenvolvimento. Consulte a [documentacao oficial de cobranca](https://docs.github.com/en/billing/concepts/product-billing/github-codespaces) e de [parada do Codespace](https://docs.github.com/en/codespaces/developing-in-a-codespace/stopping-and-starting-a-codespace).

Esse ambiente serve para desenvolvimento pessoal, nao como hospedagem publica permanente da aplicacao.

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
| `/career/applications` | Pipeline manual de candidaturas | Operacional |
| `/career/companies` | Empresas-alvo, vagas e contatos | Operacional |
| `/career/evidence` | Biblioteca de evidencias profissionais | Operacional |
| `/career/documents` | CV, carta e matriz direcionados por vaga | Operacional |

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

No detalhe de uma vaga em `/career/jobs`, `Treinar para esta vaga` abre o Grill Me com cargo, empresa, senioridade, idioma, descricao e analise estruturada como contexto. O sistema sugere um tema inicial e mantem requisitos e lacunas da vaga nos follow-ups. Sem uma vaga selecionada, o comportamento anterior permanece inalterado.

Com `AI_PROVIDER=mock`, as perguntas direcionadas sao deterministicas e gratuitas. Com `AI_PROVIDER=ollama`, o template versionado `grill-me.question@1.1.0` pode gerar variacoes localmente, com fallback automatico para o mock.

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
- analise de vagas e documentos direcionados de Career Intelligence.
- avaliacao rastreavel de competencias contra evidencias profissionais selecionadas.

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

Os templates que ainda nao possuem fluxo operacional apenas preparam contratos futuros; sua existencia no registry nao habilita funcionalidades por si so.

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

No detalhe, `Analisar vaga` gera e persiste uma leitura estruturada da descricao original: resumo tecnico, responsabilidades, requisitos obrigatorios e desejaveis, tecnologias, soft skills, senioridade estimada, aderencia ao perfil, lacunas e plano de preparacao. A aderencia usa apenas evidencias existentes no CRI, banco de perguntas e Technical Lab.

Com `AI_PROVIDER=mock`, a analise e local e deterministica. Com `AI_PROVIDER=ollama`, o modelo local pode enriquecer a estrutura; se estiver indisponivel, o gateway retorna automaticamente ao mock. Toda saida e validada pelo schema `career.job-analysis@1.0.0` antes de ser gravada.

Depois da analise, o Avaliador de Competencias compara todos os requisitos obrigatorios e desejaveis com evidencias selecionadas da Evidence Library. Cada match positivo precisa citar IDs reais e semanticamente relacionados; lacunas nao podem citar evidencias. O score e recalculado pela API, dando peso maior aos requisitos obrigatorios, para impedir inflacao pelo provider. Se a analise da vaga mudar, a interface marca a avaliacao anterior como desatualizada.

Com a matriz atualizada, `Gerar plano de preparacao` transforma cada lacuna e evidencia parcial em uma sequencia priorizada. Lacunas obrigatorias aparecem primeiro; cada item registra objetivo, acoes, criterios observaveis de conclusao, modulo recomendado e orientacao conservadora para CV/carta. Requisitos ja comprovados nao geram trabalho extra. O plano usa `career.preparation-plan@1.0.0`, funciona com o provider mock gratuito e fica marcado como desatualizado quando a matriz muda.

Para acoes de treino, a API cruza deterministicamente o requisito com os IDs reais do banco de 708 perguntas e do catalogo de desafios. O plano salva a pergunta ou desafio recomendado e a interface abre diretamente esse recurso. A escolha nao e delegada ao provider de IA, portanto IDs inventados nunca sao aceitos; se um recurso historico for removido, a tela volta ao catalogo geral com seguranca.

Cada item do plano pode ser acompanhado manualmente como `Pendente`, `Em andamento` ou `Concluido`. A conclusao registra a data, mas nao altera a matriz de competencias: uma nova avaliacao continua exigindo evidencia factual selecionada pelo usuario. Planos criados antes desse recurso aparecem como pendentes, sem necessidade de migration.

Endpoints:

- `GET /api/v1/job-opportunities`
- `GET /api/v1/job-opportunities/:opportunityId`
- `POST /api/v1/job-opportunities`
- `PATCH /api/v1/job-opportunities/:opportunityId`
- `DELETE /api/v1/job-opportunities/:opportunityId`
- `POST /api/v1/jobs/:opportunityId/analyze`
- `POST /api/v1/jobs/:opportunityId/evaluate-competencies`
- `POST /api/v1/jobs/:opportunityId/preparation-plan`
- `PATCH /api/v1/jobs/:opportunityId/preparation-plan/items/:requirementId`

Os contratos completos estao registrados em `docs/api/openapi.yaml`.

### Applications

Permite acompanhar em `/career/applications` uma candidatura para cada vaga cadastrada. O pipeline registra etapa, data de envio, proxima acao, prazo e observacoes, com busca por cargo ou empresa e filtro por etapa.

A remocao do acompanhamento preserva a vaga. A exclusao da vaga remove sua candidatura associada. Nenhuma atualizacao de status e feita implicitamente entre os dois modulos, evitando alterar regras de negocio sem uma decisao explicita.

Endpoints:

- `GET /api/v1/job-applications`
- `GET /api/v1/job-applications/:applicationId`
- `POST /api/v1/job-applications`
- `PATCH /api/v1/job-applications/:applicationId`
- `DELETE /api/v1/job-applications/:applicationId`

### Documents direcionados por vaga

Em `/career/documents`, permite gerar e salvar um pacote por vaga e idioma contendo CV em Markdown, carta de apresentacao e matriz de aderencia requisito por requisito. Os idiomas suportados sao somente Portugues (`pt-BR`) e Ingles (`en`). Gerar novamente para a mesma vaga e idioma atualiza o pacote existente; os dois idiomas podem coexistir. O formulario aceita evidencias reutilizaveis da biblioteca e contexto manual adicional, mantendo compatibilidade com o fluxo anterior.

A usuaria informa manualmente suas experiencias, competencias, projetos e resultados verdadeiros. O gerador pode reorganizar e adaptar a redacao para a vaga, mas nao deve criar empregadores, datas, resultados, ferramentas, formacao ou certificacoes ausentes. Requisitos sem evidencia ficam marcados como lacuna. Nao cole senhas, documentos pessoais nem outros dados sensiveis, e revise sempre o rascunho antes de uma candidatura.

O modo padrao `AI_PROVIDER=mock` funciona localmente e sem custo. O Ollama e opcional e usa o template versionado `career.document-pack@2.1.0`, que aceita o catalogo reutilizavel de evidencias. A resposta passa por schema JSON e por uma verificacao adicional de cobertura dos requisitos e fundamentacao das evidencias antes de ser persistida. O pacote pode ser baixado em um unico arquivo Markdown.

Endpoints:

- `GET /api/v1/career-documents`
- `GET /api/v1/career-documents/:documentId`
- `POST /api/v1/career-documents/generate`
- `DELETE /api/v1/career-documents/:documentId`

### Evidence Library

Em `/career/evidence`, registra um catalogo pessoal de fatos profissionais reutilizaveis: experiencias, projetos, resultados, competencias, certificacoes, formacao e idiomas. Cada item inclui titulo, descricao factual, competencias, resultado opcional, fonte, data e favorito.

Career Documents pode selecionar ate 30 itens do catalogo. A API valida que todos pertencem ao usuario autenticado, monta um snapshot textual e grava `sourceEvidenceIds` no pacote. Excluir uma evidencia nao altera CVs ou cartas ja gerados: o snapshot historico permanece no documento. Nao devem ser salvos segredos, documentos pessoais, dados confidenciais de empresas ou afirmacoes que nao possam ser defendidas em entrevista.

Endpoints:

- `GET /api/v1/professional-evidence`
- `GET /api/v1/professional-evidence/:evidenceId`
- `POST /api/v1/professional-evidence`
- `PATCH /api/v1/professional-evidence/:evidenceId`
- `DELETE /api/v1/professional-evidence/:evidenceId`

### Companies

Permite organizar manualmente empresas-alvo em `/career/companies`, com nome, website, LinkedIn, local, setor, porte, pesquisa sobre cultura, observacoes e favorito. Cada empresa pode ser associada explicitamente a vagas existentes e manter contatos de recrutamento com funcao, e-mail, LinkedIn, data do ultimo contato e notas.

A associacao nao altera o nome original registrado na vaga nem sincroniza status automaticamente. Excluir uma empresa remove seus contatos e desassocia as vagas, mas preserva oportunidades, candidaturas, analises e documentos. O modulo nao executa scraping, envio de e-mail, descoberta de contatos ou integracoes externas.

Endpoints:

- `GET /api/v1/companies`
- `GET /api/v1/companies/:companyId`
- `POST /api/v1/companies`
- `PATCH /api/v1/companies/:companyId`
- `DELETE /api/v1/companies/:companyId`
- `POST /api/v1/companies/:companyId/contacts`
- `PATCH /api/v1/companies/:companyId/contacts/:contactId`
- `DELETE /api/v1/companies/:companyId/contacts/:contactId`

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
22. Clicar em `Analisar vaga` e conferir aderencia, requisitos, lacunas e plano de preparacao.
23. Clicar em `Treinar para esta vaga`, conferir o contexto carregado e iniciar o Grill Me.
24. Responder uma pergunta e confirmar que o follow-up continua relacionado aos requisitos da vaga.
25. Abrir Career Intelligence > Applications e adicionar a vaga ao pipeline.
26. Alterar a etapa para entrevista, registrar uma proxima acao e conferir os contadores.
27. Remover o acompanhamento e confirmar que a oportunidade continua disponivel em Jobs.
28. Abrir Career Intelligence > Companies, cadastrar uma empresa e associar a vaga de teste.
29. Adicionar um contato, editar suas observacoes e conferir busca e filtro de favoritas.
30. Excluir o contato e confirmar que a empresa e a vaga continuam disponiveis.
31. Abrir Career Intelligence > Evidence e cadastrar um projeto verdadeiro com competencias e resultado.
32. Testar busca, tipo e favoritas; editar a evidencia e confirmar a atualizacao.
33. Voltar a Jobs, selecionar a evidencia e clicar em `Avaliar competencias`.
34. Confirmar score, cobertura de todos os requisitos, IDs citados e lacunas sem evidencia.
35. Analisar novamente a vaga e confirmar que a matriz anterior aparece como desatualizada ate nova avaliacao.
36. Refazer a avaliacao, clicar em `Gerar plano de preparacao` e conferir a ordem de prioridades.
37. Confirmar que cada lacuna/parcial tem acoes, criterio de conclusao, modulo recomendado e orientacao documental.
38. Abrir um exercicio recomendado e confirmar que o Grill Me carrega a pergunta exata ou o Technical Lab seleciona o desafio indicado.
39. Refazer a avaliacao e confirmar que o plano anterior aparece como desatualizado.
40. No detalhe da vaga, clicar em `Criar documentos` e confirmar que a vaga fica preselecionada.
41. Selecionar a evidencia salva, escolher Portugues e gerar sem precisar repetir todo o perfil.
42. Conferir CV, carta e matriz; requisitos nao sustentados devem aparecer como lacunas.
43. Baixar o Markdown, gerar tambem a versao em Ingles e confirmar que os dois pacotes ficam salvos.
44. Excluir a evidencia e confirmar que o documento, a avaliacao e o plano anteriores preservam seus snapshots historicos.
45. Excluir um pacote e confirmar que a vaga continua disponivel.
46. Excluir a empresa e confirmar que a vaga foi preservada e apenas desassociada.
47. Excluir uma oportunidade de teste e confirmar que ela desaparece da listagem.

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
- `npm.cmd run validate:devcontainer`: valida a configuração portátil e confirma que ela usa o provider gratuito.
- `npm.cmd run setup:local`: executa install, Prisma Client, PostgreSQL, migrations, seed, lint, typecheck, testes e build.
- `npm.cmd run prisma:generate`: gera Prisma Client.
- `npm.cmd run db:wait`: aguarda o PostgreSQL aceitar consultas.
- `npm.cmd run prisma:migrate`: cria migrations durante desenvolvimento.
- `npm.cmd run prisma:migrate:deploy`: aplica migrations existentes sem prompts interativos.
- `npm.cmd run prisma:migrate:status`: confirma o estado das migrations.
- `npm.cmd run seed`: executa a carga inicial idempotente.

## Qualidade e CI

O projeto inclui GitHub Actions em `.github/workflows/ci.yml` com validação do dev container, PostgreSQL de servico, `npm ci`, Prisma generate, readiness, migrations, seed, lint, typecheck, testes, build e smoke E2E.

A suite cobre unitariamente Interview, feedback, Grill Me, Guided Learning, Technical Lab, Knowledge Base, CRI, Developer Diary e os servicos de Career Intelligence. Os testes de integracao exercitam autenticacao e os endpoints principais pelo adaptador HTTP do Nest. O smoke E2E confirma o fluxo completo de entrevista e tambem vagas, empresas, contatos, evidencias reutilizaveis, avaliacao de competencias, plano de preparacao com exercicios reais, treino direcionado, candidaturas e documentos de carreira.

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
