import type { VerificationStatus } from "@/types/aesh-profile";
import type { TaxonomyRef } from "@/types/aesh-search";

export interface AeshDetail {
  id: number;
  name: string;
  bio: string;
  experience_years: number | null;
  timezone: string | null;
  verification_status: VerificationStatus;
  published_at: string | null;
  specializations: TaxonomyRef[];
  languages: TaxonomyRef[];
  modalities: TaxonomyRef[];
  countries: TaxonomyRef[];
  school_levels: TaxonomyRef[];
}
