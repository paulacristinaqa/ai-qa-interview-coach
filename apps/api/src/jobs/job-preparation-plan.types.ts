import { CompetencyCategory, CompetencyStatus, RequirementImportance } from "./competency-evaluation.types";

export type PreparationPriority = "high" | "medium" | "low";
export type RecommendedModule = "technical-lab" | "grill-me" | "evidence-library";
export type DocumentAction = "strengthen-evidence" | "omit-until-evidenced";
export type RecommendedResourceType = "question" | "challenge";
export type PreparationProgressStatus = "pending" | "in_progress" | "completed";

export interface UpdatePreparationProgressRequest {
  status: PreparationProgressStatus;
}

export interface RecommendedPreparationResource {
  type: RecommendedResourceType;
  id: string;
  title: string;
  detail: string;
  topic?: string;
  language?: "pt-BR" | "en";
  level?: number;
}

export interface PreparationSourceRequirement {
  id: string;
  text: string;
  category: CompetencyCategory;
  importance: RequirementImportance;
  status: Exclude<CompetencyStatus, "supported">;
}

export interface JobPreparationPlanOutput {
  summary: string;
  items: Array<{
    requirementId: string;
    requirement: string;
    sourceStatus: PreparationSourceRequirement["status"];
    priority: PreparationPriority;
    objective: string;
    actions: string[];
    successCriteria: string[];
    recommendedModule: RecommendedModule;
    documentAction: DocumentAction;
  }>;
}
