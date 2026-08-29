# Manual de Utilização — AI QA Interview Coach

Este manual explica como instalar, iniciar e utilizar o projeto em uma máquina nova. Também descreve como trabalhar entre computadores, onde os dados ficam armazenados e como testar os principais fluxos do MVP.

## 1. Visão geral

O AI QA Interview Coach é uma aplicação pessoal para preparação de entrevistas de Quality Assurance. O projeto reúne:

- entrevistas simuladas;
- feedback estruturado;
- Grill Me com diferentes níveis de pressão;
- Guided Learning;
- banco de perguntas;
- desafios do Technical Lab;
- Knowledge Base;
- Career Readiness Index (CRI);
- Developer Diary;
- cadastro e análise de vagas;
- biblioteca de evidências profissionais;
- matriz de aderência e plano de preparação;
- criação de CV e carta em Português ou Inglês;
- acompanhamento de candidaturas, empresas e contatos.

O modo padrão utiliza `AI_PROVIDER=mock`. Ele funciona localmente, sem chave de API e sem cobrança por requisição.

## 2. O que fica salvo em cada lugar

É importante distinguir código e dados:

| Conteúdo | Local de armazenamento |
| --- | --- |
| Código, migrations, testes e documentação | Repositório GitHub |
| Configurações locais e senhas | Arquivo `.env` de cada máquina |
| Vagas, evidências, entrevistas e demais dados pessoais | PostgreSQL local |
| Histórico de commits e branches | GitHub depois do `git push` |

O `git clone` transfere o projeto, mas não transfere o banco PostgreSQL da máquina anterior. Em uma instalação nova, o seed cria um banco inicial limpo.

Nunca envie o arquivo `.env` para o GitHub. Ele já está protegido pelo `.gitignore`.

## 3. Pré-requisitos

Instale na máquina:

- Git;
- Node.js 20 ou superior;
- Docker Desktop;
- GitHub CLI, recomendado para autenticação e Pull Requests.

No Windows PowerShell, confirme as instalações:

```powershell
git --version
node --version
npm.cmd --version
docker --version
gh --version
```

Antes de continuar, abra o Docker Desktop e aguarde o mecanismo ficar operacional:

```powershell
docker info
```

## 4. Instalação em uma máquina nova

### 4.1 Clonar o repositório

No Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force C:\projetos
Set-Location C:\projetos
git clone https://github.com/paulacristinaqa/ai-qa-interview-coach.git
Set-Location C:\projetos\ai-qa-interview-coach
git switch main
git pull origin main
```

No macOS ou Linux:

```bash
mkdir -p ~/projetos
cd ~/projetos
git clone https://github.com/paulacristinaqa/ai-qa-interview-coach.git
cd ai-qa-interview-coach
git switch main
git pull origin main
```

### 4.2 Criar o arquivo de ambiente

Windows:

```powershell
Copy-Item .env.example .env
```

macOS ou Linux:

```bash
cp .env.example .env
```

A configuração padrão usa:

- Web: porta `3000`;
- API: porta `3001`;
- PostgreSQL no computador: porta `5433`;
- database: `etqa_interview_coach`;
- usuário do banco: `etqa`;
- provider de IA: `mock`.

### 4.3 Executar o setup automático

No Windows:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1
```

O script executa instalação, Prisma Client, PostgreSQL, migrations, seed, lint, typecheck, testes e build.

Quando finalizar, deverá mostrar:

```text
Setup finished. Run npm.cmd run dev to start API and Web.
```

### 4.4 Setup manual alternativo

Se quiser executar cada etapa separadamente:

```powershell
npm.cmd install
docker compose up -d postgres
npm.cmd run prisma:generate
npm.cmd run db:wait
npm.cmd run prisma:migrate:deploy
npm.cmd run prisma:migrate:status
npm.cmd run seed
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

No macOS ou Linux, substitua `npm.cmd` por `npm`.

## 5. Iniciar e encerrar a aplicação

### Iniciar o PostgreSQL

```powershell
docker compose up -d postgres
npm.cmd run db:wait
```

### Iniciar API e frontend juntos

```powershell
npm.cmd run dev
```

Também é possível usar dois terminais:

```powershell
# Terminal 1
npm.cmd run dev:api
```

```powershell
# Terminal 2
npm.cmd run dev:web
```

### Endereços

- Aplicação: [http://localhost:3000](http://localhost:3000)
- Saúde da API: [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health)
- API e PostgreSQL: [http://localhost:3001/api/v1/health/readiness](http://localhost:3001/api/v1/health/readiness)

### Login local padrão

```text
Email: paula@example.com
Senha: change-me-locally
```

### Encerrar

Use `Ctrl+C` no terminal que executa o projeto.

Para parar o PostgreSQL sem excluir seus dados:

```powershell
docker compose stop postgres
```

Para reiniciá-lo posteriormente:

```powershell
docker compose start postgres
```

## 6. Rotina ao alternar entre computadores

### Antes de começar a trabalhar

```powershell
Set-Location C:\projetos\ai-qa-interview-coach
git switch main
git pull origin main
docker compose up -d postgres
npm.cmd run db:wait
npm.cmd run prisma:migrate:deploy
npm.cmd run dev
```

### Criar uma branch para uma alteração

```powershell
git switch main
git pull origin main
git switch -c codex/nome-do-desenvolvimento
```

### Salvar o trabalho no GitHub

Antes de enviar, execute pelo menos:

```powershell
npm.cmd run typecheck
npm.cmd run test
```

Depois:

```powershell
git status
git add .
git commit -m "descrição objetiva da alteração"
git push -u origin codex/nome-do-desenvolvimento
```

Somente commits enviados com `git push` ficam disponíveis na outra máquina.

### Autenticar o GitHub CLI

```powershell
gh auth login
gh auth status
```

Configuração da identidade dos commits:

```powershell
git config --global user.name "paulacristinaqa"
git config --global user.email "SEU_EMAIL_DO_GITHUB"
```

## 7. Fluxo recomendado de utilização

### 7.1 Preparação geral para entrevistas

1. Abra `Dashboard` e consulte o CRI e a próxima ação recomendada.
2. Em `Interviews`, configure idioma, cargo, senioridade e tema.
3. Inicie a entrevista e responda com contexto, ação, evidência, trade-off e resultado.
4. Finalize a sessão e gere o feedback.
5. Consulte o histórico na `Knowledge Base`.
6. Recalcule o CRI no `Dashboard`.
7. Registre decisões ou aprendizados no `Developer Diary`.

### 7.2 Grill Me

Use `Grill Me` para um treino mais direto:

1. Escolha tema, idioma, nível e intensidade.
2. Inicie a sessão.
3. Responda à pergunta inicial.
4. Continue pelos follow-ups.
5. Observe as notas sobre respostas vagas ou sem evidência.

Quando o Grill Me é aberto pelo detalhe de uma vaga ou pelo plano de preparação, o contexto da oportunidade e a pergunta recomendada são carregados automaticamente.

### 7.3 Technical Lab e Guided Learning

Em `Technical Lab` existem dois fluxos:

- banco de perguntas com nível e idioma;
- desafios técnicos com avaliação e solução modelo.

No banco de perguntas:

1. Escolha tema, idioma e nível.
2. Busque uma pergunta.
3. Responda ou solicite ajuda progressiva.
4. Use dica, explicação, exemplo e resposta modelo apenas quando necessário.

Nos desafios:

1. Escolha o desafio.
2. Escreva sua abordagem.
3. Envie para avaliação.
4. Compare critérios cobertos e ausentes.
5. Revele a solução somente depois da tentativa, quando possível.

## 8. Fluxo de Career Intelligence

A sequência mais segura é:

```text
Evidence Library
  → Jobs
  → Análise da vaga
  → Avaliação de competências
  → Plano de preparação
  → Grill Me ou Technical Lab
  → Documents
  → Applications e Companies
```

### 8.1 Evidence Library

Em `/career/evidence`, cadastre apenas fatos profissionais verdadeiros:

- experiências;
- projetos;
- resultados;
- competências;
- certificações;
- formação;
- idiomas.

Inclua contexto e resultado verificável. Marque como favoritas as evidências usadas com frequência.

### 8.2 Jobs

Em `/career/jobs`:

1. Cadastre título, empresa, localização e modelo de trabalho.
2. Informe senioridade, idioma, link e descrição completa.
3. Salve a oportunidade.
4. Abra o detalhe e clique em `Analisar vaga`.

Não existe scraping. A descrição deve ser informada manualmente.

### 8.3 Avaliação de competências

Depois da análise:

1. Selecione evidências que você realmente consegue defender.
2. Clique em `Avaliar competências`.
3. Confira todos os requisitos obrigatórios e desejáveis.
4. Verifique score, status, confiança e IDs citados.
5. Confirme que lacunas não possuem evidências inventadas.

Se a análise da vaga mudar, refaça a avaliação.

### 8.4 Plano de preparação

Com a avaliação atualizada:

1. Clique em `Gerar plano de preparação`.
2. Siga a ordem das prioridades.
3. Consulte ações e critérios de conclusão.
4. Abra a pergunta ou o desafio recomendado.
5. Registre nova evidência somente depois de realizar uma atividade real.

Concluir um exercício não altera automaticamente a matriz. A competência só deve ser reavaliada depois que uma evidência factual for registrada.

### 8.5 Documents

Em `/career/documents`:

1. Escolha a vaga.
2. Selecione Português ou Inglês.
3. Escolha evidências reais.
4. Gere o pacote.
5. Revise CV, carta e matriz de aderência.
6. Baixe o Markdown.

O material é um rascunho. Revise antes de enviar. Requisitos sem evidência devem continuar registrados como lacunas.

### 8.6 Applications

Em `/career/applications`, acompanhe manualmente:

- etapa atual;
- data da candidatura;
- próxima ação;
- prazo;
- observações.

A remoção da candidatura não exclui a vaga.

### 8.7 Companies

Em `/career/companies`, registre:

- empresa;
- site e LinkedIn;
- localização e setor;
- cultura e observações;
- oportunidades relacionadas;
- contatos profissionais.

Excluir uma empresa não exclui suas vagas; apenas remove a associação.

## 9. Dados, privacidade e IA

- Não informe senhas, números de documentos ou dados pessoais sensíveis nos prompts.
- Não registre competências, empresas, datas ou resultados que não sejam verdadeiros.
- O provider `mock` é a opção padrão e gratuita.
- Ollama é opcional e executa localmente.
- O projeto não precisa da OpenAI API.
- CV e carta sempre exigem revisão humana.
- A matriz de aderência não representa probabilidade de contratação.

## 10. Banco local e continuidade dos dados

O volume Docker `postgres-data` mantém o PostgreSQL quando o container é parado ou recriado normalmente.

Os dados podem ser perdidos se o volume for excluído. Não execute comandos de remoção de volume sem antes confirmar que não precisa do conteúdo.

Para usar exatamente os mesmos dados em máquinas diferentes, existem duas alternativas futuras:

1. exportar e restaurar manualmente um backup PostgreSQL;
2. configurar um PostgreSQL gratuito na nuvem.

Até essa configuração existir, cada máquina possui seu próprio banco local.

## 11. Comandos de verificação

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

Smoke E2E com API e PostgreSQL:

```powershell
npm.cmd run test:e2e:with-api
```

Estado do PostgreSQL:

```powershell
docker compose ps
docker compose logs postgres
npm.cmd run prisma:migrate:status
```

## 12. Problemas comuns

### Docker não está disponível

Abra o Docker Desktop e aguarde. Depois:

```powershell
docker info
docker compose up -d postgres
```

### PostgreSQL não responde

```powershell
docker compose ps
docker compose logs postgres
npm.cmd run db:wait
```

O projeto espera `127.0.0.1:5433`. Confirme que `POSTGRES_HOST_PORT` e `DATABASE_URL` usam a mesma porta no `.env`.

### Porta 5433 ocupada

Escolha outra porta livre no `.env`, por exemplo:

```text
POSTGRES_HOST_PORT=5434
DATABASE_URL=postgresql://etqa:etqa_password@127.0.0.1:5434/etqa_interview_coach?schema=public
```

Depois recrie apenas o container normalmente:

```powershell
docker compose up -d postgres
```

### Frontend não conecta à API

Confirme no `.env`:

```text
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3001/api/v1
```

Teste a API diretamente:

```text
http://localhost:3001/api/v1/health
```

### PowerShell bloqueia `npm.ps1`

Use `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
```

### Git rejeita o push

```powershell
gh auth login
gh auth status
git remote -v
```

Confirme que o remoto aponta para:

```text
https://github.com/paulacristinaqa/ai-qa-interview-coach.git
```

## 13. Checklist rápido para uma máquina nova

- [ ] Git, Node.js 20+, Docker Desktop e GitHub CLI instalados.
- [ ] Repositório clonado.
- [ ] Branch `main` atualizada.
- [ ] `.env` criado a partir de `.env.example`.
- [ ] Docker Desktop em execução.
- [ ] Setup automático concluído.
- [ ] PostgreSQL pronto na porta configurada.
- [ ] Aplicação aberta em `http://localhost:3000`.
- [ ] Login local realizado.
- [ ] GitHub CLI autenticado antes do primeiro push.
- [ ] Alterações enviadas ao GitHub antes de trocar de computador.
