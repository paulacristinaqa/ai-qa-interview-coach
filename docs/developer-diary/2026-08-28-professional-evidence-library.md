# Professional Evidence Library

## Estado tecnico encontrado

- Career Documents exigia que o perfil profissional fosse digitado novamente em cada geracao.
- O template `career.competency-evaluation` ja previa um `evidenceCatalog`, mas ainda nao existia uma fonte persistente e reutilizavel.
- O pacote de documentos guardava o texto usado na geracao, sem IDs que identificassem as fontes selecionadas.

## Desenvolvimento realizado

- Criada a entidade `ProfessionalEvidence`, isolada por usuario, para experiencia, projeto, resultado, competencia, certificacao, formacao e idioma.
- Implementado CRUD autenticado com busca, filtro por tipo, favoritas e validacao de limites, datas, URLs e listas de competencias.
- Adicionada a rota `/career/evidence` com cadastro, edicao, exclusao e filtros.
- Career Documents agora aceita `evidenceIds` e contexto manual opcional. O texto manual anterior permanece compativel.
- A API valida a propriedade de todos os IDs, limita a selecao a 30 itens, monta um snapshot e grava `sourceEvidenceIds` no documento.
- Excluir a fonte nao modifica documentos existentes; o snapshot historico permanece disponivel.
- O prompt de documentos evoluiu de `career.document-pack@2.0.0` para `career.document-pack@2.1.0`, sem alterar o schema de saida, para declarar o novo catalogo de entrada.

## Testes e documentacao

- Cobertura unitaria para validacao, filtros, isolamento por usuario e uso do catalogo em Career Documents.
- Integracao HTTP para o CRUD e filtros principais.
- Testes de renderizacao da biblioteca, navegacao e documentos.
- Smoke E2E para criar, selecionar e remover evidencia, confirmando a preservacao do snapshot.
- OpenAPI, README e fluxo manual atualizados.

## Limites e proximos riscos

- Evidencias sao declaradas manualmente; `sourceUrl` ajuda na rastreabilidade, mas nao representa verificacao automatica.
- O snapshot e deliberadamente imutavel em documentos existentes; para refletir uma edicao, o pacote deve ser gerado novamente.
- O proximo passo pode ativar o Avaliador de Competencias usando os IDs deste catalogo e os requisitos estruturados da vaga.
- Dados confidenciais e pessoais continuam fora do escopo e nao devem ser registrados.
