export interface CompanyFilters {
  search?: string;
  favorite?: boolean;
}

export interface CreateCompanyRequest {
  name: string;
  website?: string;
  linkedinUrl?: string;
  country?: string;
  city?: string;
  industry?: string;
  size?: string;
  workCulture?: string;
  notes?: string;
  favorite?: boolean;
  opportunityIds?: string[];
}

export type UpdateCompanyRequest = Partial<CreateCompanyRequest>;

export interface CreateCompanyContactRequest {
  name: string;
  role?: string;
  email?: string;
  linkedinUrl?: string;
  notes?: string;
  lastContactAt?: string;
}

export type UpdateCompanyContactRequest = Partial<CreateCompanyContactRequest>;
