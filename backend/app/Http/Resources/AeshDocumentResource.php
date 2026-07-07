<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\AeshDocument */
class AeshDocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'type'             => $this->type,
            'original_name'    => $this->original_name,
            'size'             => $this->size,
            'status'           => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'created_at'       => $this->created_at?->toIso8601String(),
        ];
    }
}
