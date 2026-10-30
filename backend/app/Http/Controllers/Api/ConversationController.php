<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BookingRequest;
use App\Services\ConversationProvisioner;
use App\Services\FirebaseTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    /**
     * Inbox : demandes ayant ouvert droit à une conversation (acceptées, y
     * compris si annulées depuis) pour l'utilisateur courant.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $bookings = app(FirebaseTokenService::class)->conversableBookingsFor($user);

        $data = $bookings->map(fn (BookingRequest $booking) => $this->serialize($booking, $user));

        return response()->json(['data' => $data]);
    }

    /**
     * Métadonnées d'une conversation, en garantissant que son document
     * Firestore existe avant que le front ne s'y abonne.
     */
    public function show(Request $request, BookingRequest $booking): JsonResponse
    {
        // Services Firebase résolus après authorize : sans Firebase, un accès interdit reste un 403.
        $this->authorize('converse', $booking);

        $booking->loadMissing(['parent', 'aeshProfile.user']);

        try {
            app(ConversationProvisioner::class)->ensure($booking);
        } catch (\Throwable $e) {
            // Firebase absent ou en panne : message neutre plutôt qu'une erreur technique.
            report($e);

            return response()->json(['message' => 'Messagerie momentanément indisponible.'], 503);
        }

        return response()->json([
            'data' => $this->serialize($booking, $request->user()),
        ]);
    }

    /** @return array<string, mixed> */
    private function serialize(BookingRequest $booking, $user): array
    {
        $aeshUserId = $booking->aeshProfile?->user_id;
        $peer = $user->id === $booking->parent_id
            ? $booking->aeshProfile?->user
            : $booking->parent;

        return [
            'conversation_id' => FirebaseTokenService::conversationId($booking->id),
            'booking_id' => $booking->id,
            'status' => $booking->status->value,
            'participant_ids' => array_values(array_filter([
                (string) $booking->parent_id,
                $aeshUserId !== null ? (string) $aeshUserId : null,
            ])),
            'parent_id' => (string) $booking->parent_id,
            'aesh_user_id' => $aeshUserId !== null ? (string) $aeshUserId : null,
            'peer' => $peer ? [
                'id' => $peer->id,
                'name' => $peer->name,
            ] : null,
            'created_at' => $booking->created_at?->toIso8601String(),
        ];
    }
}
