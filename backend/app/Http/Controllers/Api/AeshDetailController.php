<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AeshDetailResource;
use App\Models\AeshProfile;

class AeshDetailController extends Controller
{
    private const RELATIONS = ['user', 'specializations', 'languages', 'modalities', 'countries', 'schoolLevels'];

    /**
     * Fiche détaillée d'un AESH publié, consultée par un parent.
     * Un profil non publié reste introuvable (404) — pas de fuite d'existence.
     */
    public function show(int $id): AeshDetailResource
    {
        $profile = AeshProfile::published()
            ->with(self::RELATIONS)
            ->findOrFail($id);

        return AeshDetailResource::make($profile);
    }
}
