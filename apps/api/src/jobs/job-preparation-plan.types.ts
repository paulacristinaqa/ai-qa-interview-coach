import { CompetencyCategory, CompetencyStatus, RequirementImportance } from "./competency-evaluation.types";

export type PreparationPriority = "high" | "medium" | "low";
export type RecommendedModule = "technical-lab" | "grill-me" | "evidence-library";
export type DocumentAction = "strengthen-evidence" | "omit-until-evidenced";

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
