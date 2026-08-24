<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\AeshProfile */
class AeshProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'bio'                 => $this->bio,
            'experience_years'    => $this->experience_years,
            'timezone'            => $this->timezone,
            'phone'               => $this->phone,
            'verification_status' => $this->verification_status,
            'published_at'        => $this->published_at?->toIso8601String(),
            'is_complete'         => $this->isComplete(),
            'specialization_ids'  => $this->whenLoaded('specializations', fn () => $this->specializations->pluck('id')),
            'language_ids'        => $this->whenLoaded('languages', fn () => $this->languages->pluck('id')),
            'modality_ids'        => $this->whenLoaded('modalities', fn () => $this->modalities->pluck('id')),
            'country_ids'         => $this->whenLoaded('countries', fn () => $this->countries->pluck('id')),
            'school_level_ids'    => $this->whenLoaded('schoolLevels', fn () => $this->schoolLevels->pluck('id')),
            'created_at'          => $this->created_at?->toIso8601String(),
            'updated_at'          => $this->updated_at?->toIso8601String(),
        ];
    }
}
