import type { VerificationStatus } from "@/types/aesh-profile";

export interface TaxonomyRef {
  id: number;
  name: string;
}

export interface AeshSearchResult {
  id: number;
  name: string;
  bio: string;
  experience_years: number | null;
  verification_status: VerificationStatus;
  interview_verified_at: string | null;
  specializations: TaxonomyRef[];
  languages: TaxonomyRef[];
  modalities: TaxonomyRef[];
  countries: TaxonomyRef[];
  school_levels: TaxonomyRef[];
}

export type AeshSearchSort = "recent" | "experience";

export interface SearchFilters {
  country_id?: number;
  modality_id?: number;
  school_level_id?: number;
  language_id?: number;
  sort?: AeshSearchSort;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
