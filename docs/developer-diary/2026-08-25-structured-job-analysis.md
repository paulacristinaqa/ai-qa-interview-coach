# Analise estruturada de vagas

Data: 2026-08-25

## Estado tecnico encontrado

- `JobOpportunity` ja permitia CRUD manual e preservava a descricao original.
- O Prompt Template `career.job-analysis@1.0.0` e seu JSON Schema ja estavam versionados.
- O AI Gateway oferecia provider mock por padrao, Ollama opcional e fallback automatico.

## Implementacao

- Criados entidade Prisma `JobAnalysis`, relacao um-para-um com `JobOpportunity` e migration versionada.
- Criado `JobAnalysisService` desacoplado do CRUD de oportunidades.
- A analise coleta evidencias existentes de CRI, tentativas do banco de perguntas e Technical Lab em paralelo.
- O fallback deterministico extrai responsabilidades, requisitos, tecnologias e soft skills de forma conservadora.
- O endpoint `POST /api/v1/jobs/:opportunityId/analyze` confirma a propriedade da vaga antes de analisar.
- Resultados validos sao gravados por `upsert`, preservando uma analise atual por oportunidade.
- A interface exibe aderencia, senioridade estimada, resumo, requisitos, tecnologias, soft skills, lacunas e plano de preparacao.

## Seguranca e confiabilidade

- A analise usa somente a descricao fornecida e evidencias existentes no perfil.
- Nenhuma previsao de contratacao ou experiencia da candidata e inventada pelo fallback.
- A resposta do provider e validada novamente antes da persistencia.
- Respostas fora do schema retornam erro 502 e nao sao gravadas.
- Logs do gateway continuam sem descricao da vaga, prompts ou dados pessoais.

## Testes

- Provider mock e fallback deterministico.
- Uso do Prompt Template versionado.
- Persistencia de resposta valida e rejeicao de score fora do schema.
- Roteamento autenticado do endpoint.
- Renderizacao do painel e plano de preparacao no frontend.

## Proximos riscos

- Aderencia baseada apenas no CRI e atividades internas tem confianca limitada quando ha poucas evidencias.
- Extracao deterministica nao substitui interpretacao semantica de um modelo local.
- Descricoes extensas precisarao de limite ou segmentacao antes de ampliar o volume de dados enviado ao Ollama.
