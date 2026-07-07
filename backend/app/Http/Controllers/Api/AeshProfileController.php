<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpsertAeshProfileRequest;
use App\Http\Resources\AeshProfileResource;
use App\Models\AeshProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AeshProfileController extends Controller
{
    private const RELATIONS = ['specializations', 'languages', 'modalities', 'countries', 'schoolLevels'];

    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->aeshProfile()->with(self::RELATIONS)->first();

        if (! $profile) {
            return response()->json([
                'profile'     => null,
                'is_complete' => false,
            ]);
        }

        return response()->json([
            'profile'     => new AeshProfileResource($profile),
            'is_complete' => $profile->isComplete(),
        ]);
    }

    public function store(UpsertAeshProfileRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($user->aeshProfile()->exists()) {
            return response()->json([
                'message' => 'Un profil AESH existe déjà. Utilisez la mise à jour.',
            ], 409);
        }

        $profile = new AeshProfile($request->validated());
        $profile->user_id = $user->id;
        $profile->save();

        $this->syncTaxonomies($profile, $request);
        $profile->load(self::RELATIONS);

        return response()->json([
            'message' => 'Profil AESH créé avec succès.',
            'profile' => new AeshProfileResource($profile),
        ], 201);
    }

    public function update(UpsertAeshProfileRequest $request): JsonResponse
    {
        $profile = $request->user()->aeshProfile;

        if (! $profile) {
            return response()->json([
                'message' => 'Aucun profil AESH trouvé. Créez-le d\'abord.',
            ], 404);
        }

        $profile->update($request->validated());
        $this->syncTaxonomies($profile, $request);
        $profile->load(self::RELATIONS);

        return response()->json([
            'message' => 'Profil AESH mis à jour avec succès.',
            'profile' => new AeshProfileResource($profile),
        ]);
    }

    private function syncTaxonomies(AeshProfile $profile, UpsertAeshProfileRequest $request): void
    {
        $profile->specializations()->sync($request->input('specialization_ids', []));
        $profile->languages()->sync($request->input('language_ids', []));
        $profile->modalities()->sync($request->input('modality_ids', []));
        $profile->countries()->sync($request->input('country_ids', []));
        $profile->schoolLevels()->sync($request->input('school_level_ids', []));
    }
}
