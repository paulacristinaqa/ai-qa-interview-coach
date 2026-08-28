# Career Documents direcionados por vaga

## Estado tecnico encontrado

- A rota `/career/documents` existia apenas como estado vazio.
- O template versionado `career.document-pack@2.0.0` e seu schema ja limitavam a saida a Portugues e Ingles e proibiam alegacoes sem suporte.
- Job Opportunity, analise estruturada, pipeline de candidaturas e Grill Me direcionado ja estavam operacionais.
- O projeto continuava com `AI_PROVIDER=mock` como padrao gratuito e Ollama como opcao local.

## Desenvolvimento realizado

- Criada a entidade `CareerDocument`, vinculada ao usuario e a vaga, com um pacote por combinacao de vaga e idioma.
- Adicionados endpoints autenticados para gerar, listar, consultar e excluir pacotes.
- A geracao recebe evidencias profissionais manuais, usa o AI Gateway existente e persiste CV em Markdown, carta de apresentacao, matriz de aderencia e metadados do provider/template.
- O fallback mock e deterministico e conservador. Requisitos sem evidencia explicita sao registrados como lacunas.
- A saida passa pelo schema JSON e por validacao semantica: a matriz precisa cobrir os requisitos extraidos da vaga e evidencias positivas precisam estar fundamentadas no perfil fornecido.
- A interface permite escolher vaga e idioma, revisar o resultado, baixar Markdown e excluir o pacote. O detalhe da vaga oferece acesso com a oportunidade preselecionada.
- O suporte linguistico ficou restrito a `pt-BR` e `en`; nao ha geracao em chines.

## Testes adicionados

- Unitarios do servico para geracao gratuita, isolamento por usuario, validacao de entrada e rejeicao de saida inventada.
- Integracao HTTP para geracao e listagem autenticadas.
- Renderizacao dos componentes e exportacao Markdown no frontend.
- Smoke E2E do pacote dentro do fluxo real de Job Intelligence.

## Riscos e proximos passos

- Mesmo com validacao conservadora, CV e carta sao rascunhos e exigem revisao humana antes do envio.
- O perfil profissional e informado manualmente a cada geracao; uma futura biblioteca de evidencias versionadas pode reduzir repeticao e melhorar rastreabilidade.
- O Markdown preserva portabilidade e custo zero, mas exportacoes formatadas em PDF ou DOCX ainda nao fazem parte deste escopo.
- Modelos Ollama pequenos podem produzir redacao inferior ao mock ou falhar no schema; o fallback mantem o fluxo disponivel, mas deve permanecer coberto por testes.
