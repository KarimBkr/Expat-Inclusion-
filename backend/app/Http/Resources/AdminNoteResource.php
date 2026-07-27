<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\AdminNote */
class AdminNoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'body'       => $this->body,
            'admin'      => $this->whenLoaded('admin', fn () => [
                'id'   => $this->admin->id,
                'name' => $this->admin->name,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
