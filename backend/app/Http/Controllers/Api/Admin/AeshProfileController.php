<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RejectAeshProfileRequest;
use App\Http\Requests\Admin\SendInterviewInvitationRequest;
use App\Http\Requests\Admin\StoreAdminNoteRequest;
use App\Http\Resources\AdminNoteResource;
use App\Http\Resources\AeshProfileAdminResource;
use App\Models\AdminNote;
use App\Models\AeshProfile;
use App\Notifications\InterviewInvitationNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

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

    /**
     * Envoie à l'AESH le lien d'un entretien complémentaire (Teams, Meet, ou
     * tout autre outil au choix de l'admin — jamais de visioconférence
     * intégrée à la plateforme). Consigne l'envoi dans les notes internes
     * pour garder une trace, sans ajouter de colonne dédiée à un événement
     * ponctuel.
     */
    public function sendInterviewInvitation(SendInterviewInvitationRequest $request, int $id): JsonResponse
    {
        $profile = AeshProfile::with('user')->findOrFail($id);
        $meetingLink = $request->validated('meeting_link');
        $message = $request->validated('message');

        Notification::send(
            $profile->user,
            new InterviewInvitationNotification($profile, $meetingLink, $message),
        );

        $note = AdminNote::create([
            'admin_id'        => $request->user()->id,
            'aesh_profile_id' => $profile->id,
            'body'            => "Invitation à un entretien envoyée — lien : {$meetingLink}"
                .($message ? " · message : \"{$message}\"" : ''),
        ]);
        $note->load('admin');

        return response()->json([
            'message' => 'Invitation envoyée.',
            'data'    => new AdminNoteResource($note),
        ], 201);
    }

    /**
     * Vérification renforcée par entretien (Teams/Meet/autre, mené hors
     * plateforme). Indépendante du statut de candidature : l'admin peut
     * l'accorder à tout moment, typiquement après avoir noté son doute dans
     * les notes internes puis mené l'entretien de son côté.
     */
    public function interviewVerify(int $id): JsonResponse
    {
        $profile = AeshProfile::findOrFail($id);

        $profile->update(['interview_verified_at' => now()]);

        return response()->json([
            'message' => 'Vérification par entretien enregistrée.',
            'data'    => new AeshProfileAdminResource($profile->fresh(['user'])),
        ]);
    }

    /** Retire la vérification par entretien — correction d'une saisie admin. */
    public function removeInterviewVerification(int $id): JsonResponse
    {
        $profile = AeshProfile::findOrFail($id);

        $profile->update(['interview_verified_at' => null]);

        return response()->json([
            'message' => 'Vérification par entretien retirée.',
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
