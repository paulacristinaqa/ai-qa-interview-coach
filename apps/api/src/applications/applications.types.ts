export const applicationStatuses = [
  "planned",
  "applied",
  "screening",
  "interview",
  "technical",
  "offer",
  "hired",
  "rejected",
  "withdrawn"
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export interface CreateJobApplicationRequest {
  opportunityId: string;
  status?: ApplicationStatus;
  appliedAt?: string;
  nextAction?: string;
  nextActionAt?: string;
  notes?: string;
}

export type UpdateJobApplicationRequest = Partial<Omit<CreateJobApplicationRequest, "opportunityId">>;

export interface JobApplicationFilters {
  search?: string;
  status?: ApplicationStatus;
}
