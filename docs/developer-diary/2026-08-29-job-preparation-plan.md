# Plano de preparacao priorizado por vaga

## Estado tecnico encontrado

- Job Analysis ja produzia sugestoes gerais, antes de existir uma matriz rastreavel de competencias.
- O Avaliador de Competencias passou a fornecer a fonte confiavel para distinguir requisitos comprovados, parciais e lacunas.
- Nao havia um plano persistido que reagisse a mudancas nessa matriz nem atalhos para os modulos de pratica.

## Desenvolvimento realizado

- Criada a entidade `JobPreparationPlan`, com um plano persistido por vaga e referencia temporal a avaliacao utilizada.
- Adicionado `POST /jobs/:opportunityId/preparation-plan`, disponivel somente para vagas do usuario com analise e avaliacao atuais.
- O template versionado `career.preparation-plan@1.0.0` cobre exatamente todos os requisitos parciais e lacunas, sem incluir requisitos ja comprovados.
- A prioridade e recalculavel e deterministica: lacuna obrigatoria, demais requisitos obrigatorios ou lacunas, e por fim parciais desejaveis.
- Cada item contem objetivo, acoes, criterios observaveis, modulo recomendado e regra documental conservadora.
- O provider `mock` continua gratuito e padrao; Ollama permanece opcional com fallback automatico.
- A interface no detalhe da vaga gera, reabre e sinaliza planos desatualizados, com atalhos para Technical Lab, Grill Me ou Evidence Library.

## Testes e documentacao

- Testes unitarios cobrem priorizacao, plano vazio, propriedade, pre-condicoes, desatualizacao e rejeicao de saida incompleta.
- Integracao HTTP cobre a nova rota autenticada.
- Frontend cobre ordem, orientacao documental, modulo recomendado e estado desatualizado.
- Smoke E2E inclui a geracao do plano a partir de uma matriz real com lacuna explicita.
- OpenAPI, README e roteiro manual foram atualizados.

## Limites e proximos riscos

- O plano organiza preparacao, mas nao comprova que uma competencia foi adquirida; somente nova evidencia factual pode mudar a matriz.
- O MVP nao acompanha conclusao de tarefas nem prazos. Esse comportamento exige regras de estado e nao deve ser inferido automaticamente.
- A recomendacao de modulo usa categorias conservadoras; uma futura ligacao com desafios e perguntas especificos pode melhorar a precisao sem alterar evidencias.
