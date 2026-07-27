<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RejectAeshProfileRequest;
use App\Http\Requests\Admin\StoreAdminNoteRequest;
use App\Http\Resources\AdminNoteResource;
use App\Http\Resources\AeshProfileAdminResource;
use App\Models\AdminNote;
use App\Models\AeshProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AeshProfileController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');

        $query = AeshProfile::query()
            ->with(['user'])
            ->latest();

        if ($status) {
            $query->where('verification_status', $status);
        }

        return response()->json([
            'data' => AeshProfileAdminResource::collection($query->get()),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $profile = AeshProfile::with(['user', 'adminNotes.admin'])->findOrFail($id);

        return response()->json([
            'data' => new AeshProfileAdminResource($profile),
        ]);
    }

    public function approve(int $id): JsonResponse
    {
        $profile = AeshProfile::findOrFail($id);

        if (! $profile->isPending()) {
            return response()->json([
                'message' => 'Seul un profil en attente peut être approuvé.',
            ], 422);
        }

        $profile->update([
            'verification_status' => AeshProfile::STATUS_APPROVED,
            'rejection_reason'    => null,
        ]);

        return response()->json([
            'message' => 'Profil AESH approuvé.',
            'data'    => new AeshProfileAdminResource($profile->fresh(['user'])),
        ]);
    }

    public function reject(RejectAeshProfileRequest $request, int $id): JsonResponse
    {
        $profile = AeshProfile::findOrFail($id);

        if (! $profile->isPending()) {
            return response()->json([
                'message' => 'Seul un profil en attente peut être rejeté.',
            ], 422);
        }

        $profile->update([
            'verification_status' => AeshProfile::STATUS_REJECTED,
            'rejection_reason'    => $request->validated('rejection_reason'),
            'published_at'        => null,
        ]);

        return response()->json([
            'message' => 'Profil AESH rejeté.',
            'data'    => new AeshProfileAdminResource($profile->fresh(['user'])),
        ]);
    }

    public function publish(int $id): JsonResponse
    {
        $profile = AeshProfile::findOrFail($id);

        if (! $profile->isApproved()) {
            return response()->json([
                'message' => 'Seul un profil approuvé peut être publié.',
            ], 422);
        }

        $profile->update([
            'verification_status' => AeshProfile::STATUS_PUBLISHED,
            'published_at'        => now(),
        ]);

        return response()->json([
            'message' => 'Profil AESH publié.',
            'data'    => new AeshProfileAdminResource($profile->fresh(['user'])),
        ]);
    }

    public function storeNote(StoreAdminNoteRequest $request, int $id): JsonResponse
    {
        $profile = AeshProfile::findOrFail($id);

        $note = AdminNote::create([
            'admin_id'        => $request->user()->id,
            'aesh_profile_id' => $profile->id,
            'body'            => $request->validated('body'),
        ]);

        $note->load('admin');

        return response()->json([
            'message' => 'Note ajoutée.',
            'data'    => new AdminNoteResource($note),
        ], 201);
    }
}
