# Job Intelligence Manual

Data: 2026-08-25

## Estado tecnico encontrado

- A rota `/career/jobs` existia apenas como estado vazio.
- Nao havia entidade persistente, endpoints ou contratos OpenAPI para oportunidades.
- O projeto ja possuia autenticacao local e o padrao de isolamento dos registros por `userId`.

## Implementacao

- Criada a entidade Prisma `JobOpportunity` e sua migration versionada.
- Implementado CRUD autenticado em `/api/v1/job-opportunities`.
- Adicionados filtros por busca, status, modelo de trabalho, senioridade e favorito.
- Entradas textuais sao normalizadas; status e modelo usam conjuntos permitidos.
- Links aceitam apenas URLs HTTP ou HTTPS.
- Consultas, detalhe, edicao e exclusao confirmam a propriedade da oportunidade pelo usuario autenticado.
- A interface `/career/jobs` agora oferece cadastro, filtros, listagem, detalhe, edicao e exclusao.
- Os endpoints e schemas foram adicionados ao OpenAPI.

## Testes

- Testes unitarios cobrem filtros, normalizacao, validacao, isolamento por usuario e exclusao.
- Teste de integracao cobre o roteamento HTTP de criacao, listagem, atualizacao e exclusao autenticadas.
- Testes de frontend cobrem renderizacao do resumo/detalhe e composicao dos filtros.

## Limites desta etapa

- Nao ha scraping, importacao automatica ou integracao com sites de vagas.
- Nao ha analise de vaga por IA nesta entrega.
- Applications, Companies e Documents continuam como rotas preparadas.

## Proximos riscos

- Descricoes muito extensas precisarao de limites antes da futura analise por IA.
- Status ainda e controlado manualmente e nao possui historico de transicoes.
- O proximo modulo devera criar `JobAnalysis` sem acoplar o CRUD manual ao provider de IA.
