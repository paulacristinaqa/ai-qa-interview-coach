# Prompt Templates versionados

Data: 2026-08-25

## Estado tecnico encontrado

- O AI Gateway local ja validava respostas com JSON Schema e possuia fallback deterministico.
- Os prompts dos quatro fluxos ativos estavam concentrados em um unico arquivo e tinham apenas versoes textuais simples.
- Technical Lab e Career ainda nao possuiam contratos de prompt preparados na `main`.

## Alteracoes

- Criado registry central de Prompt Templates.
- Templates separados por Interview, Guided Learning, Grill Me, Technical Lab e Career.
- Cada template agora declara ID, versao semantica, objetivo, entradas esperadas, formato de saida, schema, criterios e regras de seguranca.
- Interview, Feedback, Guided Learning e Grill Me foram migrados para consumir o registry.
- O provider Ollama agora recebe tambem os criterios declarados pelo template.
- Adicionados schemas preparatorios para Technical Lab feedback, analise de carreira, Job Analysis, avaliacao de competencias e pacote de documentos.
- Mantido o tratamento existente para JSON invalido e schema incompativel.

## Compatibilidade

- Nenhuma regra de negocio foi modificada.
- `AI_PROVIDER=mock` continua sendo o padrao.
- Os templates de Technical Lab e Career nao chamam IA enquanto seus respectivos servicos nao forem integrados explicitamente em entregas futuras.

## Validacao

- Testes confirmam cobertura dos cinco dominios, IDs unicos e metadados obrigatorios.
- Testes confirmam composicao da versao canonica e criterios especificos por requisicao.
- Respostas validas e invalidas sao verificadas, incluindo limite de score e bloqueio de alegacoes nao sustentadas em documentos de carreira.

## Proximos riscos

- Uma mudanca de texto sem incremento de versao prejudica a rastreabilidade; revisoes futuras devem tratar template e versao como um contrato.
- JSON Schema garante estrutura, mas validacoes semanticas entre campos ainda serao necessarias nos modulos Career.
- Templates futuros precisam de conjuntos de avaliacao para medir qualidade, vies e regressao entre versoes.
