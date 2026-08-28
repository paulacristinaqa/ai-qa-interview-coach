# Career Companies manual

## Estado tecnico encontrado

- `/career/companies` ainda era uma rota vazia.
- Vagas guardavam apenas o nome textual da empresa, e Applications registrava que normalizacao de empresa e contato deveria ficar neste modulo futuro.
- Nenhuma integracao externa, scraping, e-mail ou calendario era necessaria para a primeira entrega.

## Desenvolvimento realizado

- Criadas entidades `Company` e `CompanyContact`, sempre vinculadas ao usuario autenticado.
- Adicionada associacao opcional entre `JobOpportunity` e uma empresa normalizada, preservando o campo textual original da vaga.
- Implementado CRUD manual de empresas, busca por nome, setor, local ou contato e filtro de favoritas.
- Implementado cadastro, edicao e remocao de contatos com funcao, e-mail, LinkedIn, ultimo contato e observacoes.
- A associacao de vagas exige propriedade do mesmo usuario e so muda quando enviada explicitamente.
- Excluir uma empresa remove seus contatos e define a associacao das vagas como nula; vagas, candidaturas, analises e documentos permanecem intactos.
- A rota Companies agora oferece pesquisa, detalhe, edicao, selecao de vagas e gerenciamento de contatos.

## Testes e documentacao

- Adicionados testes unitarios de propriedade, duplicidade, associacao e contatos.
- Adicionada cobertura de integracao dos endpoints autenticados e renderizacao do frontend.
- O smoke E2E agora cria empresa, associa vaga, adiciona contato, filtra e confirma a preservacao da vaga apos exclusao.
- OpenAPI, README e fluxo de QA manual foram atualizados.

## Limites e proximos riscos

- Nomes semelhantes ainda dependem de decisao manual; o sistema bloqueia apenas duplicatas exatas sem diferenca de maiusculas/minusculas.
- Contatos sao informados manualmente e nao recebem mensagens nem lembretes automaticos.
- Mover uma vaga para outra empresa e uma acao explicita e preserva o nome textual historico da oportunidade.
- Indicadores de relacionamento, lembretes e pesquisa assistida de empresas exigem regras proprias antes de uma proxima etapa.
