export type InterviewLanguage = "pt-BR" | "en";
export type InterviewDifficulty = "medium" | "advanced" | "specialist";

export interface StartInterviewRequest {
  language: InterviewLanguage;
  targetRole: string;
  seniority: string;
  topic: string;
  difficulty: InterviewDifficulty;
  interviewerStyle?: string;
  companyContext?: string;
  durationMinutes?: number;
}

export interface SubmitAnswerRequest {
  answer: string;
}

export interface InterviewTurn {
  orderIndex: number;
  question: string;
  answer?: string;
  coachNote?: string;
}

export interface InterviewSession {
  id: string;
  language: InterviewLanguage;
  targetRole: string;
  seniority: string;
  topic: string;
  difficulty: InterviewDifficulty;
  interviewerStyle: string;
  status: "started" | "completed";
  turns: InterviewTurn[];
  createdAt: string;
}

