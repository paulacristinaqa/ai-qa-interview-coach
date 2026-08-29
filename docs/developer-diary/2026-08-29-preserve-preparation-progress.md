# Preservação do progresso ao regenerar o plano — 2026-08-29

## Estado encontrado

Gerar novamente o plano substituía o JSON persistido e reiniciava todos os itens como pendentes, mesmo quando a avaliação ainda continha exatamente os mesmos requisitos. Isso apagava um acompanhamento manual válido.

## Correção realizada

- o plano anterior é carregado junto da oportunidade;
- status e data de conclusão são preservados quando ID e texto do requisito permanecem iguais;
- requisitos novos, alterados ou com progresso histórico inválido começam pendentes;
- ações, critérios e recursos recomendados continuam sendo recalculados normalmente;
- a matriz de competências permanece independente do acompanhamento manual;
- testes unitários e smoke E2E cobrem a preservação no PostgreSQL.

## Risco restante

O plano continua sendo uma fotografia única por vaga. Se futuramente for necessário auditar várias versões completas, será preciso modelar histórico de planos em vez de apenas preservar o progresso compatível.
