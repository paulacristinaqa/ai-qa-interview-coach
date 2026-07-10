export type GrillMeLanguage = "pt-BR" | "en";
export type GrillMeLevel = "basic" | "intermediate" | "advanced";
export type GrillMeMode = "standard" | "light-pressure" | "realistic";

export interface StartGrillMeRequest {
  topic: string;
  language: GrillMeLanguage;
  level: GrillMeLevel;
  mode: GrillMeMode;
  targetRole?: string;
}

export interface SubmitGrillMeAnswerRequest {
  answer: string;
  helpUsed?: boolean;
}
