<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpsertParentProfileRequest;
use App\Http\Resources\ParentProfileResource;
use App\Models\ParentProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParentProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->parentProfile()
            ->with(['country', 'schoolLevel', 'specialization'])
            ->first();

        if (! $profile) {
            return response()->json([
                'profile'     => null,
                'is_complete' => false,
            ]);
        }

        return response()->json([
            'profile'     => new ParentProfileResource($profile),
            'is_complete' => $profile->isComplete(),
        ]);
    }

    public function store(UpsertParentProfileRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($user->parentProfile()->exists()) {
            return response()->json([
                'message' => 'Un profil parent existe déjà. Utilisez la mise à jour.',
            ], 409);
        }

        $profile = ParentProfile::create([
            ...$request->validated(),
            'user_id'       => $user->id,
            'consented_at'  => now(),
        ]);

        $profile->load(['country', 'schoolLevel', 'specialization']);

        return response()->json([
            'message' => 'Profil parent créé avec succès.',
            'profile' => new ParentProfileResource($profile),
        ], 201);
    }

    public function update(UpsertParentProfileRequest $request): JsonResponse
    {
        $profile = $request->user()->parentProfile;

        if (! $profile) {
            return response()->json([
                'message' => 'Aucun profil parent trouvé. Créez-le d\'abord.',
            ], 404);
        }

        $profile->update([
            ...$request->validated(),
            'consented_at' => now(),
        ]);

        $profile->load(['country', 'schoolLevel', 'specialization']);

        return response()->json([
            'message' => 'Profil parent mis à jour avec succès.',
            'profile' => new ParentProfileResource($profile),
        ]);
    }
}
