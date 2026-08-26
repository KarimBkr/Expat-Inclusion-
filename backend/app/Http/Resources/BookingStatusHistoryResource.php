<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\BookingStatusHistory */
class BookingStatusHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'from_status' => $this->from_status?->value,
            'to_status'   => $this->to_status->value,
            'label'       => $this->to_status->label(),
            'reason'      => $this->reason,
            'author'      => $this->whenLoaded('author', fn () => $this->author ? ['id' => $this->author->id, 'name' => $this->author->name] : null),
            'created_at'  => $this->created_at?->toIso8601String(),
        ];
    }
}
