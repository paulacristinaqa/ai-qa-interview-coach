# IA local com custo zero

Data: 2026-08-25

## Estado tecnico encontrado

- O MVP possuia comportamento deterministico para Interview, Feedback, Guided Learning e Grill Me.
- `AI_PROVIDER=mock` ja aparecia no exemplo de ambiente, mas nao existia uma camada de provider conectada aos servicos.
- A maquina de desenvolvimento possui aproximadamente 32 GB de memoria; nenhuma GPU dedicada foi confirmada pela inspecao disponivel.
- O Ollama nao estava instalado no momento da implementacao, portanto a integracao real foi validada com transporte HTTP simulado e schemas reais.

## Decisoes

- Manter `AI_PROVIDER=mock` como padrao para setup, testes e CI sem dependencias externas.
- Adicionar `AI_PROVIDER=ollama` como opcao local sem chave ou cobranca por requisicao.
- Usar `qwen3:4b` como modelo inicial por ser compacto, multilingue e adequado a execucao local nesta maquina.
- Centralizar selecao, fallback e logs em um AI Gateway.
- Enviar schemas JSON ao endpoint local `/api/chat` e validar novamente a resposta antes de usa-la.
- Nao registrar prompts, respostas, descricoes pessoais nem conteudo de entrevistas nos logs.

## Problemas corrigidos

- Interview passou a aceitar geracao local de perguntas iniciais e follow-ups.
- Feedback passou a persistir a identificacao do modelo e a versao do prompt usados.
- Guided Learning passou a gerar explicacoes sem alterar o bloqueio progressivo da resposta modelo.
- Grill Me passou a aceitar perguntas geradas preservando os modos e limites de turnos existentes.
- Falhas de conexao, timeout, HTTP e JSON/schema invalido agora retornam automaticamente ao comportamento deterministico.
- O E2E gerenciado fixa `AI_PROVIDER=mock`, evitando dependencia acidental de um servico local no CI.

## Validacao

- Testes unitarios cobrem mock padrao, chamada HTTP do Ollama, resposta valida, JSON invalido, timeout e fallback.
- Testes dos quatro dominios verificam o uso da saida do gateway sem mudar as regras existentes.
- A validacao ao vivo com o modelo ainda depende da instalacao local do Ollama e do download de `qwen3:4b`.

## Proximos riscos

- Modelos pequenos podem produzir feedback menos preciso; schemas garantem formato, nao qualidade semantica.
- Execucao somente em CPU pode apresentar latencia perceptivel, especialmente na primeira carga.
- Entradas muito longas exigirao uma politica explicita de limite e resumo antes de futuras features de Career.
- A camada de templates deve evoluir em entregas pequenas, com versoes e testes de regressao por dominio.
