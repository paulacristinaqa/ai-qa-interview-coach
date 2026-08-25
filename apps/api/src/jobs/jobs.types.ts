export const jobStatuses = ["saved", "applied", "interviewing", "offer", "rejected", "archived"] as const;
export const workModels = ["remote", "hybrid", "onsite"] as const;

export type JobStatus = (typeof jobStatuses)[number];
export type WorkModel = (typeof workModels)[number];

export interface CreateJobOpportunityRequest {
  title: string;
  company: string;
  country: string;
  city?: string;
  workModel: WorkModel;
  seniority: string;
  language: string;
  link?: string;
  originalDescription: string;
  status?: JobStatus;
  favorite?: boolean;
  notes?: string;
}

export type UpdateJobOpportunityRequest = Partial<CreateJobOpportunityRequest>;

export interface JobOpportunityFilters {
  search?: string;
  status?: JobStatus;
  workModel?: WorkModel;
  seniority?: string;
  favorite?: boolean;
}
