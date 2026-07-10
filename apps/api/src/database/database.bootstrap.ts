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
  return topicCatalog.flatMap((topic) =>
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
}

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
