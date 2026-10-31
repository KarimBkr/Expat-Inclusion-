<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Vue admin d'une demande de réservation : visibilité transverse (cockpit
 * US-19), pas une nouvelle action — l'admin n'accepte/refuse/annule rien ici,
 * ça reste le state machine parent/AESH existant (US-12).
 *
 * @mixin \App\Models\BookingRequest
 */
class AdminBookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'status'          => $this->status->value,
            'status_label'    => $this->status->label(),
            'message'         => $this->message,
            'start_date'      => $this->start_date?->toDateString(),
            'hours_per_week'  => $this->hours_per_week,
            'response_reason' => $this->response_reason,
            'responded_at'    => $this->responded_at?->toIso8601String(),
            'created_at'      => $this->created_at?->toIso8601String(),
            'modality'        => $this->whenLoaded('modality', fn () => ['id' => $this->modality->id, 'name' => $this->modality->name]),
            'school_level'    => $this->whenLoaded('schoolLevel', fn () => ['id' => $this->schoolLevel->id, 'name' => $this->schoolLevel->name]),
            'parent'          => $this->whenLoaded('parent', fn () => ['id' => $this->parent->id, 'name' => $this->parent->name, 'email' => $this->parent->email]),
            'aesh'            => $this->whenLoaded('aeshProfile', fn () => [
                'id'      => $this->aeshProfile->id,
                'user_id' => $this->aeshProfile->user_id,
                'name'    => $this->aeshProfile->relationLoaded('user') ? $this->aeshProfile->user->name : null,
                'email'   => $this->aeshProfile->relationLoaded('user') ? $this->aeshProfile->user->email : null,
            ]),
            'payments_enabled' => (bool) config('services.stripe.platform_fee_enabled'),
            'payments'        => PaymentResource::collection($this->whenLoaded('payments')),
            'histories'       => BookingStatusHistoryResource::collection($this->whenLoaded('statusHistories')),
            'admin_notes'     => AdminNoteResource::collection($this->whenLoaded('adminNotes')),
        ];
    }
}
