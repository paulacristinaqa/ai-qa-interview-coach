export const evidenceTypes = ["experience", "project", "achievement", "skill", "certification", "education", "language"] as const;
export type EvidenceType = (typeof evidenceTypes)[number];

export interface EvidenceFilters {
  search?: string;
  type?: EvidenceType;
  favorite?: boolean;
}

export interface CreateEvidenceRequest {
  type: EvidenceType;
  title: string;
  description: string;
  skills?: string[];
  outcome?: string;
  sourceUrl?: string;
  occurredAt?: string;
  favorite?: boolean;
}

export type UpdateEvidenceRequest = Partial<CreateEvidenceRequest>;
