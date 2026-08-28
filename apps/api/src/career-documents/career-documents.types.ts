export type CareerDocumentLanguage = "pt-BR" | "en";
export type FitStatus = "supported" | "partial" | "gap";

export interface GenerateCareerDocumentRequest {
  opportunityId: string;
  language: CareerDocumentLanguage;
  candidateProfile: string;
}

export interface CareerDocumentOutput {
  cvMarkdown: string;
  coverLetter: string;
  fitMatrix: Array<{
    requirement: string;
    evidence: string;
    status: FitStatus;
  }>;
  unsupportedClaims: string[];
}
