import type { TaxonomyRef } from "@/types/aesh-search";

export type BookingStatus = "requested" | "accepted" | "declined" | "cancelled";

export interface BookingStatusHistory {
  id: number;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  label: string;
  reason: string | null;
  author?: { id: number; name: string };
  created_at: string | null;
}

export interface BookingRequest {
  id: number;
  status: BookingStatus;
  status_label: string;
  is_final: boolean;
  message: string;
  start_date: string | null;
  hours_per_week: number;
  hourly_rate: string;
  response_reason: string | null;
  responded_at: string | null;
  created_at: string | null;
  modality?: TaxonomyRef;
  school_level?: TaxonomyRef;
  parent?: { id: number; name: string };
  aesh?: { id: number; user_id?: number; name: string | null };
  can_message?: boolean;
  conversation_id?: string | null;
  histories?: BookingStatusHistory[];
}

export interface CreateBookingPayload {
  aesh_profile_id: number;
  message: string;
  modality_id: number;
  school_level_id: number;
  start_date: string;
  hours_per_week: number;
}
