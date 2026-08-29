# Progresso manual do plano de preparação — 2026-08-29

## Estado encontrado

O plano de preparação já persistia prioridades, ações, critérios de conclusão e links para exercícios reais, mas não permitia registrar o andamento do usuário. Os itens são armazenados em JSON, portanto o progresso pôde ser acrescentado sem mudança de schema ou migration do PostgreSQL.

## Desenvolvimento realizado

- adicionados os estados `pending`, `in_progress` e `completed` por item;
- novos itens começam pendentes e a conclusão registra `completedAt`;
- planos antigos sem os novos campos continuam válidos e aparecem como pendentes;
- criado endpoint autenticado e isolado por usuário para atualizar somente um item;
- adicionados seletor de progresso, contador de concluídos e bloqueio visual em planos desatualizados;
- preservada a regra de que progresso não altera automaticamente a matriz de competências;
- atualizados OpenAPI, manual, testes unitários, integração, frontend e smoke E2E.

## Riscos e próximos passos

- regenerar o plano substitui os itens e reinicia o progresso, comportamento coerente com uma nova fotografia da matriz, mas que pode exigir histórico dedicado no futuro;
- o JSON mantém compatibilidade sem migration, porém mudanças estruturais maiores podem justificar uma entidade própria para itens;
- o próximo passo recomendado é consolidar o uso remoto de custo zero e validar o fluxo completo em outra máquina.
