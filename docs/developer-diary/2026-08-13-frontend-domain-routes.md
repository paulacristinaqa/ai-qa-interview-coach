# Separacao do frontend por dominio

Tipo: refactor

Data: 2026-08-13

## Estado encontrado

- A pagina principal concentrava autenticacao, estado, chamadas HTTP e todas as interfaces do MVP em um unico componente cliente.
- Nao existia navegacao persistente nem URLs proprias para cada dominio.
- O frontend nao possuia testes de renderizacao ou da configuracao de navegacao.

## Decisoes e alteracoes

- Criado um layout compartilhado com autenticacao e navegacao lateral.
- Extraidas rotas para Dashboard, Interviews, Grill Me, Technical Lab, Knowledge Base, Developer Diary e Settings.
- Mantidos os endpoints, payloads e fluxos funcionais existentes em cada dominio.
- A raiz passou a redirecionar para `/dashboard`.
- Criados placeholders sem chamadas de API para Jobs, Applications, Companies e Documents.
- Adicionados componentes compartilhados para cabecalho, mensagens de estado e telas vazias.
- Adicionados testes basicos de renderizacao e do mapa de navegacao.

## Evidencias

- Lint e typecheck aprovados nos workspaces API e Web.
- Testes: 9 na API e 4 no frontend, todos aprovados.
- Build do Next.js gerou todas as rotas documentadas, incluindo a rota raiz e os placeholders de Career Intelligence.
- Smoke E2E autenticado da API aprovado contra PostgreSQL local.

## Proximos riscos

- Os testes do frontend ainda nao simulam interacoes completas com navegador e API.
- A navegacao lateral em telas pequenas prioriza funcionalidade; uma etapa futura pode melhorar a experiencia mobile.
- As rotas de Career Intelligence sao deliberadamente vazias e devem receber funcionalidades em PRs independentes.
