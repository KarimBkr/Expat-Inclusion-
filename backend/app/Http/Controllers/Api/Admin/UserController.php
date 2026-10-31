<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminUserResource;
use App\Models\User;
use App\Services\FirebaseTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Cockpit admin — utilisateurs (US-19). Action volontairement limitée à
 * suspendre/réactiver : pas de backoffice CRM complexe (hors périmètre MVP,
 * voir CLAUDE.md), juste de quoi bloquer un compte problématique sans le
 * supprimer.
 */
class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $role = $request->query('role');
        $search = trim((string) $request->query('search', ''));

        $users = User::query()
            ->with('aeshProfile')
            ->when($role, fn ($q) => $q->where('role', $role))
            ->when($search !== '', fn ($q) => $q->where(fn ($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")))
            ->latest()
            ->get();

        return AdminUserResource::collection($users);
    }

    public function show(int $id): AdminUserResource
    {
        $user = User::with('aeshProfile')->findOrFail($id);

        return AdminUserResource::make($user);
    }

    public function suspend(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->isAdmin()) {
            return response()->json([
                'message' => 'Impossible de suspendre un compte administrateur.',
            ], 422);
        }

        $user->update(['suspended_at' => now()]);

        // Firebase indisponible ou non configuré : la suspension côté API reste effective.
        try {
            app(FirebaseTokenService::class)->revokeFor($user);
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'message' => 'Compte suspendu.',
            'data'    => new AdminUserResource($user->fresh('aeshProfile')),
        ]);
    }

    public function reactivate(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $user->update(['suspended_at' => null]);

        return response()->json([
            'message' => 'Compte réactivé.',
            'data'    => new AdminUserResource($user->fresh('aeshProfile')),
        ]);
    }
}
