# Avaliador de Competencias por vaga

## Estado tecnico encontrado

- O prompt versionado `career.competency-evaluation@1.0.0` e seu schema ja existiam, mas nao havia servico, persistencia, endpoint ou interface.
- Job Analysis ja extraia requisitos obrigatorios e desejaveis.
- A Evidence Library passou a fornecer IDs de fatos profissionais reutilizaveis e isolados por usuario.

## Desenvolvimento realizado

- Criada a entidade `CompetencyEvaluation`, com uma avaliacao persistida por vaga, score, matriz completa, IDs selecionados, metadados do provider e data da analise usada.
- Implementado `POST /jobs/:opportunityId/evaluate-competencies` com `mock` gratuito por padrao e Ollama opcional.
- A avaliacao exige Job Analysis e ao menos uma evidencia pertencente ao usuario autenticado.
- Todos os requisitos da analise devem aparecer exatamente uma vez, mantendo texto, categoria e importancia.
- Matches positivos precisam citar IDs selecionados com sobreposicao semantica; lacunas nao podem citar evidencia.
- O score e recalculado pela API, com peso 2 para requisitos obrigatorios e peso 1 para desejaveis.
- A interface de Jobs permite selecionar evidencias, executar a avaliacao, ver confianca, racional, orientacao documental e IDs citados.
- Quando a data de Job Analysis muda, a matriz anterior e exibida como desatualizada ate uma nova avaliacao.

## Testes e documentacao

- Testes unitarios cobrem fallback deterministico, cobertura completa, propriedade, requisitos ausentes e rejeicao de IDs inventados.
- Integracao HTTP cobre a nova rota autenticada.
- Frontend cobre renderizacao de matches, lacunas, score e rastreabilidade.
- Smoke E2E analisa a vaga, avalia competencias e confirma que IDs historicos permanecem apos excluir a evidencia.
- OpenAPI, README e fluxo manual foram atualizados.

## Limites e proximos riscos

- O matching deterministico e lexical e deliberadamente conservador; sinonimos podem permanecer como match parcial ou lacuna.
- A avaliacao nao representa probabilidade de contratacao e nao deve ser usada como decisao automatizada.
- Editar uma evidencia nao altera matrizes ja persistidas; a avaliacao deve ser refeita para incorporar mudancas.
- Uma proxima etapa pode usar a matriz validada para priorizar automaticamente o plano de preparacao e a ordem dos documentos, sem inventar competencias.
