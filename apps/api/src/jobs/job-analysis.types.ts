export interface JobAnalysisOutput {
  technicalSummary: string;
  responsibilities: string[];
  requiredRequirements: string[];
  preferredRequirements: string[];
  technologies: string[];
  softSkills: string[];
  estimatedSeniority: string;
  profileFit: { score: number; summary: string; evidence: string[] };
  gaps: string[];
  preparationPlan: Array<{ priority: "high" | "medium" | "low"; action: string; rationale: string }>;
}
