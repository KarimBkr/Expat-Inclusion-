<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Demande de réservation vue par le parent auteur ou l'AESH destinataire.
 * Les coordonnées (email, téléphone) ne transitent pas ici : l'échange passe
 * par la messagerie une fois la demande acceptée.
 *
 * @mixin \App\Models\BookingRequest
 */
class BookingRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'status'          => $this->status->value,
            'status_label'    => $this->status->label(),
            'is_final'        => $this->status->isFinal(),
            'message'         => $this->message,
            'start_date'      => $this->start_date?->toDateString(),
            'hours_per_week'  => $this->hours_per_week,
            'response_reason' => $this->response_reason,
            'responded_at'    => $this->responded_at?->toIso8601String(),
            'created_at'      => $this->created_at?->toIso8601String(),
            'modality'        => $this->whenLoaded('modality', fn () => ['id' => $this->modality->id, 'name' => $this->modality->name]),
            'school_level'    => $this->whenLoaded('schoolLevel', fn () => ['id' => $this->schoolLevel->id, 'name' => $this->schoolLevel->name]),
            'parent'          => $this->whenLoaded('parent', fn () => ['id' => $this->parent->id, 'name' => $this->parent->name]),
            'aesh'            => $this->whenLoaded('aeshProfile', fn () => [
                'id'   => $this->aeshProfile->id,
                'name' => $this->aeshProfile->relationLoaded('user') ? $this->aeshProfile->user->name : null,
            ]),
            'histories'       => BookingStatusHistoryResource::collection($this->whenLoaded('statusHistories')),
        ];
    }
}
