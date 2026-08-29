# Exercicios reais no plano de preparacao

## Estado tecnico encontrado

- O plano priorizado indicava Technical Lab, Grill Me ou Evidence Library, mas abria apenas a pagina geral do modulo.
- O banco de perguntas e os desafios tecnicos ja possuíam IDs persistidos e conteudo suficiente para recomendacao local.
- Grill Me sempre escolhia a proxima pergunta pelos filtros, sem aceitar uma pergunta especifica do catalogo.

## Desenvolvimento realizado

- A geracao do plano passou a consultar perguntas no idioma da vaga e desafios tecnicos em paralelo.
- Um matcher local e deterministico relaciona texto do requisito, tema, competencia, area, contexto e criterios; Docker e ferramentas de automacao usam a area Automation como fallback conservador.
- O recurso recomendado e anexado somente depois da validacao da IA. Assim, o provider nunca escolhe nem inventa IDs.
- Itens de Evidence Library permanecem sem recurso artificial, pois exigem uma evidencia real criada pela usuaria.
- Grill Me aceita `questionId`, valida idioma, inicia pela pergunta exata e preserva seu ID durante a tentativa.
- Technical Lab aceita `challengeId` na URL e seleciona o desafio real solicitado.
- A interface do plano mostra titulo e metadados do exercicio antes de abrir o deep link.

## Testes e riscos

- Testes cobrem selecao de pergunta/desafio, pergunta exata no Grill Me, deep link, fallback de recurso removido e renderizacao.
- O smoke E2E confirma que IDs recomendados existem nos catalogos e que Grill Me usa a pergunta persistida.
- O matching continua lexical e conservador; a recomendacao e pratica, nao uma afirmacao de que o exercicio cobre integralmente o requisito.
- Alteracoes futuras no seed devem preservar IDs historicos enquanto houver planos persistidos ou manter o fallback seguro da interface.
