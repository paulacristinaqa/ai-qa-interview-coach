import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { hashPassword } from "./password";
import { PrismaService } from "./prisma.service";

const topicCatalog = [
  {
    topic: "API Testing",
    competency: "APIs",
    subjects: ["REST contracts", "status codes", "authentication", "pagination", "idempotency", "error handling"]
  },
  {
    topic: "SQL",
    competency: "SQL",
    subjects: ["joins", "aggregations", "data reconciliation", "CTEs", "null handling", "audit queries"]
  },
  {
    topic: "Test Design",
    competency: "Pensamento critico",
    subjects: ["boundary values", "decision tables", "risk-based testing", "regression scope", "negative scenarios", "test data"]
  },
  {
    topic: "Automation",
    competency: "Automacao",
    subjects: ["test pyramid", "flaky tests", "selectors", "CI feedback", "API automation", "maintenance strategy"]
  },
  {
    topic: "Behavioral",
    competency: "Behavioral",
    subjects: ["conflict", "ownership", "communication", "feedback", "prioritization", "learning from failure"]
  },
  {
    topic: "Agile/QA Process",
    competency: "Comunicacao",
    subjects: ["definition of done", "shift-left", "bug triage", "sprint planning", "quality metrics", "release readiness"]
  }
];

const languages = ["pt-BR", "en"];
const levels = [1, 2, 3];
const levelNames: Record<number, { pt: string; en: string }> = {
  1: { pt: "basico", en: "basic" },
  2: { pt: "intermediario", en: "intermediate" },
  3: { pt: "avancado", en: "advanced" }
};

const seededQuestions = buildSeededQuestions();

const seededChallenges = [
  {
    area: "API",
    title: "Plano de teste para endpoint de login",
    difficulty: "medium",
    context: "Desenhe uma estrategia de testes para login com email, senha, bloqueio por tentativas e token JWT.",
    evaluationCriteria: ["cobertura funcional", "seguranca", "dados de teste", "observabilidade"],
    modelSolution:
      "Cobriria sucesso, senha invalida, usuario inexistente, bloqueio, expiracao de token, payload invalido, rate limit e logs sem dados sensiveis."
  },
  {
    area: "SQL",
    title: "Validacao de relatorio financeiro",
    difficulty: "advanced",
    context: "Um relatorio soma pagamentos por mes e status. Defina checks de qualidade de dados e consultas de apoio.",
    evaluationCriteria: ["massa controlada", "agregacoes", "reconciliacao", "casos nulos"],
    modelSolution:
      "Criaria massa com meses, status e nulos, compararia totais por agregacao, reconciliaria origem-destino e testaria arredondamentos."
  },
  {
    area: "Test Design",
    title: "Matriz de testes para checkout com cupom",
    difficulty: "medium",
    context:
      "Em uma entrevista, pedem que voce desenhe cenarios para um checkout com carrinho, cupom percentual, frete, pagamento recusado e estoque limitado.",
    evaluationCriteria: ["cenarios positivos", "cenarios negativos", "bordas", "tabela de decisao", "risco de regressao"],
    modelSolution:
      "Eu criaria uma tabela de decisao cruzando cupom valido/invalido/expirado, frete gratis/pago, estoque disponivel/indisponivel e pagamento aprovado/recusado, priorizando riscos de cobranca incorreta e pedido criado sem pagamento."
  },
  {
    area: "Automation",
    title: "Estrategia para reduzir testes flaky no CI",
    difficulty: "advanced",
    context:
      "O pipeline de uma squad falha de forma intermitente em testes E2E. Explique como voce investigaria, estabilizaria e decidiria o que automatizar em outro nivel.",
    evaluationCriteria: ["causa raiz", "isolamento", "observabilidade", "piramide de testes", "criterio de remocao"],
    modelSolution:
      "Eu separaria falhas por tipo, adicionaria logs/screenshots/traces, buscaria dependencia de tempo ou dados, moveria checks instaveis para API/unit quando possivel e manteria E2E apenas para fluxos criticos com dados controlados."
  },
  {
    area: "API",
    title: "Investigacao de bug intermitente em endpoint paginado",
    difficulty: "advanced",
    context:
      "Durante a entrevista, o avaliador diz que clientes recebem itens duplicados em uma API paginada quando usam filtros e ordenacao. Monte sua investigacao.",
    evaluationCriteria: ["reproducao minima", "contrato", "ordenacao estavel", "dados concorrentes", "evidencia"],
    modelSolution:
      "Eu criaria massa controlada, fixaria filtros e ordenacao, verificaria cursor/offset, testaria dados inseridos durante a paginacao e coletaria request ids e queries para provar se o problema e contrato, ordenacao ou concorrencia."
  },
  {
    area: "SQL",
    title: "Auditoria de divergencia entre pedido e pagamento",
    difficulty: "medium",
    context:
      "Um gestor reporta que o dashboard mostra mais pedidos pagos do que a tabela de pagamentos conciliados. Explique queries e checks que voce faria.",
    evaluationCriteria: ["joins", "duplicidade", "nulos", "status", "reconciliacao"],
    modelSolution:
      "Eu compararia chaves de pedido/pagamento, status considerados como pago, duplicidades por pagamento, pedidos sem pagamento e pagamentos sem pedido, fechando totais por periodo com queries de reconciliacao."
  },
  {
    area: "Test Design",
    title: "Plano exploratorio para feature pouco especificada",
    difficulty: "basic",
    context:
      "O PO entrega uma feature com requisitos incompletos perto do fim da sprint. Descreva como voce testaria sem travar o time.",
    evaluationCriteria: ["perguntas", "riscos", "charter exploratorio", "priorizacao", "comunicacao"],
    modelSolution:
      "Eu faria perguntas de escopo minimo, listaria riscos, criaria charters exploratorios curtos, validaria fluxos criticos primeiro e comunicaria claramente incertezas e decisoes tomadas."
  },
  {
    area: "Automation",
    title: "Escolha entre automatizar UI ou API",
    difficulty: "basic",
    context:
      "Em uma entrevista, perguntam como voce decide se um cenario deve ser automatizado via UI, API ou teste unitario.",
    evaluationCriteria: ["valor", "velocidade", "estabilidade", "cobertura", "manutencao"],
    modelSolution:
      "Eu avaliaria o risco coberto, velocidade de feedback, estabilidade e custo de manutencao. Preferiria API/unit para regra e contrato, deixando UI para fluxos criticos de integracao real."
  }
];

@Injectable()
export class DatabaseBootstrap implements OnModuleInit {
  private readonly logger = new Logger(DatabaseBootstrap.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedSingleUser();
    await this.seedQuestionBank();
    await this.seedTechnicalLab();
  }

  private async seedSingleUser() {
    const email = process.env.SINGLE_USER_EMAIL ?? "paula@example.com";
    await this.prisma.user.upsert({
      where: { email },
      update: {
        name: process.env.SINGLE_USER_NAME ?? "Paula QA Tester",
        locale: "pt-BR"
      },
      create: {
        id: "single-user",
        name: process.env.SINGLE_USER_NAME ?? "Paula QA Tester",
        email,
        passwordHash: hashPassword(process.env.SINGLE_USER_PASSWORD ?? "change-me-locally"),
        locale: "pt-BR"
      }
    });
  }

  private async seedQuestionBank() {
    for (const question of seededQuestions) {
      const existing = await this.prisma.question.findFirst({
        where: { topic: question.topic, language: question.language, level: question.level, prompt: question.prompt }
      });
      if (!existing) {
        await this.prisma.question.create({ data: question });
      }
    }
    this.logger.log(`Question bank ready with at least ${seededQuestions.length} seeded questions`);
  }

  private async seedTechnicalLab() {
    for (const challenge of seededChallenges) {
      const existing = await this.prisma.technicalChallenge.findFirst({
        where: { title: challenge.title }
      });
      if (!existing) {
        await this.prisma.technicalChallenge.create({ data: challenge });
      }
    }
  }
}

function buildSeededQuestions() {
  const baseQuestions = topicCatalog.flatMap((topic) =>
    languages.flatMap((language) =>
      levels.flatMap((level) =>
        topic.subjects.map((subject, index) => ({
          topic: topic.topic,
          language,
          level,
          type: index % 2 === 0 ? "technical" : "scenario",
          competency: topic.competency,
          prompt: buildPrompt(language, topic.topic, subject, level),
          criteria: buildCriteria(language, subject, level),
          hints: buildHints(language, subject, level),
          modelAnswer: buildModelAnswer(language, topic.topic, subject, level)
        }))
      )
    )
  );

  return [...baseQuestions, ...buildSupplementalQuestions()];
}

function buildSupplementalQuestions() {
  return topicCatalog.flatMap((topic) => {
    const combinations = languages.flatMap((language) =>
      levels.flatMap((level) =>
        supplementalAngles.map((angle, index) => ({
          topic: topic.topic,
          language,
          level,
          type: angle.type,
          competency: topic.competency,
          prompt: buildSupplementalPrompt(language, topic.topic, angle, level),
          criteria: buildSupplementalCriteria(language, angle, level),
          hints: buildSupplementalHints(language, angle, level),
          modelAnswer: buildSupplementalModelAnswer(language, topic.topic, angle, level, index)
        }))
      )
    );

    return combinations.slice(0, 82);
  });
}

const supplementalAngles = [
  { type: "technical", focus: "risk analysis", pt: "analise de risco", en: "risk analysis" },
  { type: "scenario", focus: "incident investigation", pt: "investigacao de incidente", en: "incident investigation" },
  { type: "technical", focus: "test data strategy", pt: "estrategia de massa de dados", en: "test data strategy" },
  { type: "scenario", focus: "stakeholder communication", pt: "comunicacao com stakeholders", en: "stakeholder communication" },
  { type: "technical", focus: "regression strategy", pt: "estrategia de regressao", en: "regression strategy" },
  { type: "scenario", focus: "production readiness", pt: "prontidao para producao", en: "production readiness" },
  { type: "technical", focus: "observability", pt: "observabilidade", en: "observability" },
  { type: "scenario", focus: "prioritization under pressure", pt: "priorizacao sob pressao", en: "prioritization under pressure" },
  { type: "technical", focus: "root cause reasoning", pt: "raciocinio de causa raiz", en: "root cause reasoning" },
  { type: "scenario", focus: "ambiguous requirements", pt: "requisitos ambiguos", en: "ambiguous requirements" },
  { type: "technical", focus: "quality metrics", pt: "metricas de qualidade", en: "quality metrics" },
  { type: "scenario", focus: "cross-team alignment", pt: "alinhamento entre times", en: "cross-team alignment" },
  { type: "technical", focus: "automation ROI", pt: "retorno de automacao", en: "automation ROI" },
  { type: "scenario", focus: "interview follow-up", pt: "follow-up de entrevista", en: "interview follow-up" }
];

function buildPrompt(language: string, topic: string, subject: string, level: number) {
  const levelLabel = language === "en" ? levelNames[level].en : levelNames[level].pt;
  if (language === "en") {
    return `In a ${levelLabel} QA interview, explain how you would handle ${subject} in ${topic}. Include a concrete example and one trade-off.`;
  }

  return `Em uma entrevista QA de nivel ${levelLabel}, explique como voce lidaria com ${subject} em ${topic}. Inclua um exemplo concreto e um trade-off.`;
}

function buildCriteria(language: string, subject: string, level: number) {
  const base =
    language === "en"
      ? ["clear context", "technical reasoning", "concrete example", "risk awareness"]
      : ["contexto claro", "raciocinio tecnico", "exemplo concreto", "consciencia de risco"];
  const advanced =
    language === "en"
      ? ["trade-off", "edge cases", "stakeholder impact"]
      : ["trade-off", "cenarios de borda", "impacto para stakeholders"];
  return level === 1 ? [...base, subject] : [...base, ...advanced, subject];
}

function buildHints(language: string, subject: string, level: number) {
  if (language === "en") {
    return [
      `Start by defining the risk behind ${subject}.`,
      "Use context, action, result, and trade-off.",
      level >= 2 ? "Mention edge cases and how you would get evidence." : "Keep the answer short and concrete."
    ];
  }

  return [
    `Comece explicando o risco por tras de ${subject}.`,
    "Use contexto, acao, resultado e trade-off.",
    level >= 2 ? "Cite cenarios de borda e como obter evidencias." : "Mantenha a resposta curta e concreta."
  ];
}

function buildModelAnswer(language: string, topic: string, subject: string, level: number) {
  if (language === "en") {
    return `I would start from the risk and expected behavior for ${subject} in ${topic}, create representative positive and negative cases, define observable evidence, and explain the main trade-off. At level ${level}, I would also connect the decision to business impact and regression risk.`;
  }

  return `Eu comecaria pelo risco e pelo comportamento esperado de ${subject} em ${topic}, criaria casos positivos e negativos representativos, definiria evidencias observaveis e explicaria o principal trade-off. No nivel ${level}, tambem conectaria a decisao ao impacto de negocio e risco de regressao.`;
}

function buildSupplementalPrompt(
  language: string,
  topic: string,
  angle: { pt: string; en: string; focus: string },
  level: number
) {
  const levelLabel = language === "en" ? levelNames[level].en : levelNames[level].pt;
  if (language === "en") {
    return `Grill Me ${levelLabel}: for ${topic}, answer a technical interview question about ${angle.en}. Give your reasoning, evidence, and one follow-up question you would ask.`;
  }

  return `Grill Me ${levelLabel}: em ${topic}, responda uma pergunta de entrevista tecnica sobre ${angle.pt}. Traga raciocinio, evidencia e uma pergunta de follow-up que voce faria.`;
}

function buildSupplementalCriteria(language: string, angle: { pt: string; en: string }, level: number) {
  const base =
    language === "en"
      ? ["clear answer", angle.en, "evidence", "practical example", "trade-off"]
      : ["resposta clara", angle.pt, "evidencia", "exemplo pratico", "trade-off"];
  const advanced =
    language === "en"
      ? ["business impact", "edge case", "decision rationale"]
      : ["impacto de negocio", "cenario de borda", "justificativa da decisao"];
  return level >= 2 ? [...base, ...advanced] : base;
}

function buildSupplementalHints(language: string, angle: { pt: string; en: string }, level: number) {
  if (language === "en") {
    return [
      `Anchor the answer on ${angle.en}.`,
      "State what evidence would prove your approach.",
      level === 3 ? "Challenge your own solution with a failure mode." : "Keep the answer structured and concrete."
    ];
  }

  return [
    `Ancore a resposta em ${angle.pt}.`,
    "Diga qual evidencia provaria sua abordagem.",
    level === 3 ? "Questione sua propria solucao com um modo de falha." : "Mantenha a resposta estruturada e concreta."
  ];
}

function buildSupplementalModelAnswer(
  language: string,
  topic: string,
  angle: { pt: string; en: string },
  level: number,
  index: number
) {
  if (language === "en") {
    return `For ${topic}, I would frame ${angle.en} by naming the risk, choosing a small but representative example, defining observable evidence, and explaining the trade-off. At level ${level}, I would also mention stakeholder impact and one follow-up question to reduce ambiguity.`;
  }

  return `Em ${topic}, eu estruturaria ${angle.pt} nomeando o risco, escolhendo um exemplo pequeno e representativo, definindo evidencia observavel e explicando o trade-off. No nivel ${level}, tambem citaria impacto para stakeholders e uma pergunta de follow-up para reduzir ambiguidade.`;
}
