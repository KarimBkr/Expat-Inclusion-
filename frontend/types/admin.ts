export type TaxonomyType =
  | "countries"
  | "specializations"
  | "languages"
  | "school-levels"
  | "modalities";

export interface TaxonomyMeta {
  type: TaxonomyType;
  label: string;
  singular: string;
}

export const TAXONOMY_TYPES: TaxonomyMeta[] = [
  { type: "countries", label: "Pays", singular: "pays" },
  { type: "specializations", label: "Spécialités", singular: "spécialité" },
  { type: "languages", label: "Langues", singular: "langue" },
  { type: "school-levels", label: "Niveaux scolaires", singular: "niveau scolaire" },
  { type: "modalities", label: "Modalités", singular: "modalité" },
];

export type TaxonomyRecord = Record<string, string | number | boolean | null> & { id: number };

export interface TaxonomyListResponse {
  data: TaxonomyRecord[];
}

export interface TaxonomyMutationResponse {
  message: string;
  data: TaxonomyRecord;
}

export type AeshVerificationStatus = "pending" | "approved" | "rejected" | "published";

export interface AdminNote {
  id: number;
  body: string;
  admin?: { id: number; name: string };
  created_at: string;
}

export interface AeshProfileAdmin {
  id: number;
  user_id: number;
  verification_status: AeshVerificationStatus;
  rejection_reason: string | null;
  published_at: string | null;
  bio: string | null;
  user?: { id: number; name: string; email: string };
  admin_notes?: AdminNote[];
  created_at?: string;
  updated_at?: string;
}

export const STATUS_LABELS: Record<AeshVerificationStatus, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Rejeté",
  published: "Publié",
};
