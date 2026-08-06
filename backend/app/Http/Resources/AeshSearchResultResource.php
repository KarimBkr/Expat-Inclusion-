<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Fiche AESH pour la recherche parent — champs publics uniquement.
 * Aucune donnée de contact (email, téléphone) n'est exposée ici.
 *
 * @mixin \App\Models\AeshProfile
 */
class AeshSearchResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'name'                => $this->whenLoaded('user', fn () => $this->user->name),
            'bio'                 => $this->bio,
            'hourly_rate'         => $this->hourly_rate,
            'experience_years'    => $this->experience_years,
            'verification_status' => $this->verification_status,
            'specializations'     => $this->whenLoaded('specializations', fn () => $this->specializations->map(fn ($s) => ['id' => $s->id, 'name' => $s->name])),
            'languages'           => $this->whenLoaded('languages', fn () => $this->languages->map(fn ($l) => ['id' => $l->id, 'name' => $l->name])),
            'modalities'          => $this->whenLoaded('modalities', fn () => $this->modalities->map(fn ($m) => ['id' => $m->id, 'name' => $m->name])),
            'countries'           => $this->whenLoaded('countries', fn () => $this->countries->map(fn ($c) => ['id' => $c->id, 'name' => $c->name])),
            'school_levels'       => $this->whenLoaded('schoolLevels', fn () => $this->schoolLevels->map(fn ($sl) => ['id' => $sl->id, 'name' => $sl->name])),
        ];
    }
}
