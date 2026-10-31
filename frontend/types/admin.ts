import type { AeshDocument } from "@/types/aesh-profile";

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
  interview_verified_at: string | null;
  bio: string | null;
  user?: { id: number; name: string; email: string };
  documents?: AeshDocument[];
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

// ── Cockpit admin (US-19) ───────────────────────────────────────────────────

export type BookingStatus = "requested" | "accepted" | "declined" | "cancelled" | "confirmed";

export interface AdminPayment {
  id: number;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed";
  paid_at: string | null;
  created_at: string | null;
}

export interface AdminBookingHistory {
  id: number;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  label: string;
  reason: string | null;
  author?: { id: number; name: string };
  created_at: string | null;
}

export interface AdminBooking {
  id: number;
  status: BookingStatus;
  status_label: string;
  message: string;
  start_date: string | null;
  hours_per_week: number;
  response_reason: string | null;
  responded_at: string | null;
  created_at: string | null;
  modality?: { id: number; name: string };
  school_level?: { id: number; name: string };
  parent?: { id: number; name: string; email: string };
  aesh?: { id: number; user_id: number; name: string | null; email: string | null };
  payments_enabled?: boolean;
  payments?: AdminPayment[];
  histories?: AdminBookingHistory[];
  admin_notes?: AdminNote[];
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  requested: "En attente",
  accepted: "Acceptée",
  declined: "Refusée",
  cancelled: "Annulée",
  confirmed: "Confirmée",
};

export type UserRole = "parent" | "aesh" | "admin";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  parent: "Parent",
  aesh: "AESH",
  admin: "Admin",
};

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  email_verified_at: string | null;
  suspended_at: string | null;
  created_at: string | null;
  aesh_verification_status?: AeshVerificationStatus | null;
}
