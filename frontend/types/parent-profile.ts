export interface Country {
  id: number;
  code: string;
  name: string;
  is_aefe_network: boolean;
}

export interface Specialization {
  id: number;
  slug: string;
  name: string;
}

export interface SchoolLevel {
  id: number;
  slug: string;
  name: string;
  cycle: string;
  order: number;
}

export interface Language {
  id: number;
  code: string;
  name: string;
}

export interface Modality {
  id: number;
  slug: string;
  name: string;
}

export interface Taxonomies {
  countries: Country[];
  specializations: Specialization[];
  school_levels: SchoolLevel[];
  languages: Language[];
  modalities: Modality[];
}

export interface ParentProfile {
  id: number;
  country_id: number;
  timezone: string;
  phone: string | null;
  child_first_name: string;
  school_level_id: number;
  specialization_id: number;
  child_brief: string | null;
  consent_terms: boolean;
  consent_data_processing: boolean;
  consent_marketing: boolean;
  consented_at: string | null;
  is_complete: boolean;
  country?: Pick<Country, "id" | "code" | "name">;
  school_level?: Pick<SchoolLevel, "id" | "slug" | "name">;
  specialization?: Pick<Specialization, "id" | "slug" | "name">;
  created_at?: string;
  updated_at?: string;
}

export interface ParentProfileResponse {
  profile: ParentProfile | null;
  is_complete: boolean;
}

export interface UpsertParentProfilePayload {
  country_id: number;
  timezone: string;
  phone?: string | null;
  child_first_name: string;
  school_level_id: number;
  specialization_id: number;
  child_brief?: string | null;
  consent_terms: boolean;
  consent_data_processing: boolean;
  consent_marketing?: boolean;
}
