import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { hashPassword } from "./password";
import { PrismaService } from "./prisma.service";

const seededQuestions = [
  {
    topic: "API Testing",
    language: "pt-BR",
    level: 1,
    type: "technical",
    competency: "APIs",
    prompt: "Como voce validaria um endpoint REST que cria usuarios?",
    criteria: ["menciona status code", "valida payload", "cobre erros", "pensa em contrato"],
    hints: ["Comece pelo contrato", "Inclua cenarios felizes e negativos"],
    modelAnswer: "Eu validaria contrato, status 201, schema, persistencia, duplicidade, campos obrigatorios e mensagens de erro."
  },
  {
    topic: "API Testing",
    language: "pt-BR",
    level: 2,
    type: "scenario",
    competency: "APIs",
    prompt: "Uma API retorna 500 intermitente em producao. Como voce investigaria?",
    criteria: ["usa logs", "correlaciona payload", "isola ambiente", "prioriza impacto"],
    hints: ["Pense em observabilidade", "Explique como reduziria o escopo"],
    modelAnswer: "Eu correlacionaria logs, request ids, payloads e dependencias externas, depois reproduziria o menor caso possivel."
  },
  {
    topic: "SQL",
    language: "pt-BR",
    level: 1,
    type: "technical",
    competency: "SQL",
    prompt: "Explique como testaria uma regra de negocio baseada em joins entre pedidos e pagamentos.",
    criteria: ["define dados", "testa joins", "valida bordas", "confirma agregacoes"],
    hints: ["Monte massa controlada", "Inclua pedidos sem pagamento"],
    modelAnswer: "Eu criaria massa minima com pedidos pagos, pendentes e sem pagamento, validando joins, filtros e totais esperados."
  },
  {
    topic: "Automation",
    language: "pt-BR",
    level: 2,
    type: "technical",
    competency: "Automacao",
    prompt: "Como voce decidiria o que automatizar primeiro em uma suite regressiva?",
    criteria: ["risco", "frequencia", "estabilidade", "valor de feedback"],
    hints: ["Nem tudo precisa ser automatizado primeiro", "Priorize risco e repeticao"],
    modelAnswer: "Eu priorizaria fluxos criticos, repetitivos, estaveis e com alto custo manual, deixando cenarios instaveis para investigacao."
  }
];

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
        where: { topic: question.topic, level: question.level, prompt: question.prompt }
      });
      if (!existing) {
        await this.prisma.question.create({ data: question });
      }
    }
    this.logger.log("Question bank ready");
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
