# Ampliacao da cobertura de testes do MVP

Tipo: quality

Data: 2026-08-13

## Estado encontrado

- A API possuia 9 testes distribuidos em 5 arquivos.
- Interview tinha somente dois cenarios em memoria; Guided Learning, feedback, Grill Me, Technical Lab, Knowledge Base, CRI e Developer Diary nao possuiam testes unitarios dedicados.
- Nao havia teste de integracao HTTP dos principais controllers.
- O smoke E2E verificava somente endpoints de leitura e nao comprovava o fluxo central de entrevista.

## Alteracoes

- Adicionados testes unitarios para Interview, feedback, Grill Me, Guided Learning, Technical Lab, Knowledge Base, CRI e Developer Diary.
- Adicionado teste de integracao HTTP autenticado para os endpoints principais, incluindo rejeicao sem token.
- Expandido o smoke E2E para iniciar entrevista, responder, validar follow-up, finalizar, gerar feedback, recalcular CRI e confirmar historico e entrada no Developer Diary.
- Criado runner que gerencia a API compilada durante o E2E e aguarda readiness antes do fluxo.
- Adicionado o E2E gerenciado ao GitHub Actions depois do build.

## Evidencias

- API: 13 arquivos e 35 testes aprovados.
- Frontend: 2 arquivos e 4 testes aprovados.
- Total: 15 arquivos e 39 testes aprovados.
- Lint, typecheck e builds da API e Web aprovados.
- Duas migrations e seed de 708 perguntas aplicados em schema PostgreSQL isolado.
- Smoke E2E completo aprovado contra a API e o PostgreSQL reais.

## Proximos riscos

- A suite valida comportamento, mas ainda nao publica percentuais de cobertura por linha ou branch.
- O frontend ainda precisa de testes de interacao em navegador para formulários e transicoes entre rotas autenticadas.
- Concorrencia, volume e falhas de infraestrutura nao estao cobertos nesta etapa.
