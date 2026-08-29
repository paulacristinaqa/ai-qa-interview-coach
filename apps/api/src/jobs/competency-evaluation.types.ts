export interface EvaluateCompetenciesRequest {
  evidenceIds: string[];
}

export type CompetencyCategory = "technical" | "experience" | "education" | "certification" | "language" | "soft_skill" | "other";
export type CompetencyStatus = "supported" | "partial" | "gap";
export type RequirementImportance = "required" | "preferred";

export interface CompetencyEvaluationOutput {
  summary: string;
  overallScore: number;
  requirements: Array<{
    id: string;
    text: string;
    category: CompetencyCategory;
    importance: RequirementImportance;
    status: CompetencyStatus;
    confidence: number;
    evidenceIds: string[];
    rationale: string;
    documentGuidance: string;
  }>;
}
