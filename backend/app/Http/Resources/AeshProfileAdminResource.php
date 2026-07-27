<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\AeshProfile */
class AeshProfileAdminResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'user_id'             => $this->user_id,
            'verification_status' => $this->verification_status,
            'rejection_reason'    => $this->rejection_reason,
            'published_at'        => $this->published_at?->toIso8601String(),
            'bio'                 => $this->bio,
            'user'                => $this->whenLoaded('user', fn () => [
                'id'    => $this->user->id,
                'name'  => $this->user->name,
                'email' => $this->user->email,
            ]),
            'admin_notes'         => AdminNoteResource::collection($this->whenLoaded('adminNotes')),
            'created_at'          => $this->created_at?->toIso8601String(),
            'updated_at'          => $this->updated_at?->toIso8601String(),
        ];
    }
}
