<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class AdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'name'                => $this->name,
            'email'               => $this->email,
            'role'                => $this->role,
            'email_verified_at'   => $this->email_verified_at?->toIso8601String(),
            'suspended_at'        => $this->suspended_at?->toIso8601String(),
            'created_at'          => $this->created_at?->toIso8601String(),
            'aesh_verification_status' => $this->whenLoaded(
                'aeshProfile',
                fn () => $this->aeshProfile?->verification_status,
            ),
        ];
    }
}
