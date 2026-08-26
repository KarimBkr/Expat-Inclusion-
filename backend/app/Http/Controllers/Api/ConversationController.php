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
    public function __construct(
        private readonly FirebaseTokenService $tokens,
        private readonly ConversationProvisioner $provisioner,
    ) {}

    /**
     * Inbox : demandes ayant ouvert droit à une conversation (acceptées, y
     * compris si annulées depuis) pour l'utilisateur courant.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $bookings = $this->tokens->conversableBookingsFor($user);

        $data = $bookings->map(fn (BookingRequest $booking) => $this->serialize($booking, $user));

        return response()->json(['data' => $data]);
    }

    /**
     * Métadonnées d'une conversation, en garantissant que son document
     * Firestore existe avant que le front ne s'y abonne.
     */
    public function show(Request $request, BookingRequest $booking): JsonResponse
    {
        $this->authorize('converse', $booking);

        $booking->loadMissing(['parent', 'aeshProfile.user']);

        $this->provisioner->ensure($booking);

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
