<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ParentProfile */
class ParentProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                      => $this->id,
            'country_id'              => $this->country_id,
            'timezone'                => $this->timezone,
            'phone'                   => $this->phone,
            'child_first_name'        => $this->child_first_name,
            'school_level_id'         => $this->school_level_id,
            'specialization_id'       => $this->specialization_id,
            'child_brief'             => $this->child_brief,
            'consent_terms'           => $this->consent_terms,
            'consent_data_processing' => $this->consent_data_processing,
            'consent_marketing'       => $this->consent_marketing,
            'consented_at'            => $this->consented_at?->toIso8601String(),
            'is_complete'             => $this->isComplete(),
            'country'                 => $this->whenLoaded('country', fn () => [
                'id'   => $this->country->id,
                'code' => $this->country->code,
                'name' => $this->country->name,
            ]),
            'school_level'            => $this->whenLoaded('schoolLevel', fn () => [
                'id'   => $this->schoolLevel->id,
                'slug' => $this->schoolLevel->slug,
                'name' => $this->schoolLevel->name,
            ]),
            'specialization'          => $this->whenLoaded('specialization', fn () => [
                'id'   => $this->specialization->id,
                'slug' => $this->specialization->slug,
                'name' => $this->specialization->name,
            ]),
            'created_at'              => $this->created_at?->toIso8601String(),
            'updated_at'              => $this->updated_at?->toIso8601String(),
        ];
    }
}
