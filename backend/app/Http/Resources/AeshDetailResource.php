<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Fiche AESH détaillée pour un parent.
 * Aucune donnée de contact (email, téléphone) n'est exposée : la mise en
 * relation passe par une demande de réservation, jamais par un contact direct.
 *
 * @mixin \App\Models\AeshProfile
 */
class AeshDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'name'                => $this->whenLoaded('user', fn () => $this->user->name),
            'bio'                 => $this->bio,
            'hourly_rate'         => $this->hourly_rate,
            'experience_years'    => $this->experience_years,
            'timezone'            => $this->timezone,
            'verification_status' => $this->verification_status,
            'published_at'        => $this->published_at?->toIso8601String(),
            'documents_verified'  => ($this->approved_documents_count ?? 0) > 0,
            'specializations'     => $this->whenLoaded('specializations', fn () => $this->specializations->map(fn ($s) => ['id' => $s->id, 'name' => $s->name])),
            'languages'           => $this->whenLoaded('languages', fn () => $this->languages->map(fn ($l) => ['id' => $l->id, 'name' => $l->name])),
            'modalities'          => $this->whenLoaded('modalities', fn () => $this->modalities->map(fn ($m) => ['id' => $m->id, 'name' => $m->name])),
            'countries'           => $this->whenLoaded('countries', fn () => $this->countries->map(fn ($c) => ['id' => $c->id, 'name' => $c->name])),
            'school_levels'       => $this->whenLoaded('schoolLevels', fn () => $this->schoolLevels->map(fn ($sl) => ['id' => $sl->id, 'name' => $sl->name])),
        ];
    }
}
