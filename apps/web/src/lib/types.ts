export interface User {
  id: string;
  name: string;
  email: string;
}

export interface DashboardData {
  user: User;
  cri: { score: number; confidenceLevel: string; trend: string; limitation: string };
  interviewReadiness: { status: string; nextBestAction: string };
  competencies: Array<{ name: string; score: number; status: string }>;
  priorityCards: Array<{ id: string; title: string; score: number; severity: string; action: string }>;
  weeklyProgress: {
    completedSessions: number;
    activeSessions: number;
    questionAttempts: number;
    technicalAttempts: number;
    knowledgeItems: number;
    diaryEntries: number;
  };
  recentHistory: Array<{ type: string; title: string; detail: string; date: string }>;
  shortcuts: Array<{ id: string; label: string; topic: string }>;
  emptyState: { title: string; message: string };
}

export interface InterviewSession {
  id: string;
  language: "pt-BR" | "en";
  targetRole: string;
  seniority: string;
  topic: string;
  difficulty: string;
  status: "started" | "completed";
  turns: Array<{ orderIndex: number; question: string; answer?: string; coachNote?: string }>;
}

export interface Question {
  id: string;
  topic: string;
  language: "pt-BR" | "en";
  level: number;
  competency: string;
  prompt: string;
  criteria: string[];
  hints: string[];
  modelAnswer: string;
}

export interface TechnicalChallenge {
  id: string;
  area: string;
  title: string;
  difficulty: string;
  context: string;
}

export type JsonRecord = Record<string, unknown>;
export type GrillMode = "standard" | "light-pressure" | "realistic";
export type GrillLevel = "basic" | "intermediate" | "advanced";
export type HelpLevel = "hint" | "explanation" | "example" | "model-answer";

export interface GrillMeResponse {
  mode: GrillMode;
  level?: GrillLevel;
  sourceQuestion?: Question;
  attempt?: JsonRecord | null;
  session: InterviewSession;
}

export interface QuestionTopic {
  topic: string;
  competency: string;
}

export interface FeedbackReport {
  overallSummary: string;
  confidenceLevel: string;
  dimensions: Array<{ dimension: string; score: number; evidence: string; recommendation: string }>;
}

export interface LearningEvent {
  helpLevel: HelpLevel;
  content: { blocked?: boolean; explanation?: string; nextPrompt?: string };
}

export interface CriResponse {
  score: number;
  confidenceLevel: string;
  composition: Record<string, number>;
  evidenceGaps: string[];
  explanation?: {
    summary: string;
    strongestPillar: string;
    evidenceLevel: string;
    nextBestAction: string;
  };
}
