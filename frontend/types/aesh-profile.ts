export type VerificationStatus = "pending" | "approved" | "rejected";

export type DocumentType = "diploma" | "identity" | "certification" | "other";

export interface AeshProfile {
  id: number;
  bio: string;
  hourly_rate: string;
  experience_years: number | null;
  timezone: string;
  phone: string | null;
  verification_status: VerificationStatus;
  is_published: boolean;
  is_complete: boolean;
  specialization_ids?: number[];
  language_ids?: number[];
  modality_ids?: number[];
  country_ids?: number[];
  school_level_ids?: number[];
  created_at?: string;
  updated_at?: string;
}

export interface AeshProfileResponse {
  profile: AeshProfile | null;
  is_complete: boolean;
}

export interface UpsertAeshProfilePayload {
  bio: string;
  hourly_rate: number;
  experience_years?: number | null;
  timezone: string;
  phone?: string | null;
  specialization_ids: number[];
  language_ids: number[];
  modality_ids: number[];
  country_ids: number[];
  school_level_ids?: number[];
}

export interface AeshDocument {
  id: number;
  type: DocumentType;
  original_name: string;
  size: number;
  status: VerificationStatus;
  rejection_reason: string | null;
  created_at: string;
}
