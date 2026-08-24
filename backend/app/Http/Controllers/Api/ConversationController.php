<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\BookingRequest;
use App\Services\FirebaseTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function __construct(private readonly FirebaseTokenService $tokens) {}

    /**
     * Inbox : demandes acceptées de l'utilisateur courant (threads possibles).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $bookings = $this->tokens->acceptedBookingsFor($user);

        $data = $bookings->map(fn (BookingRequest $booking) => $this->serialize($booking, $user));

        return response()->json(['data' => $data]);
    }

    /**
     * Métadonnées d'une conversation liée à une demande acceptée.
     */
    public function show(Request $request, BookingRequest $booking): JsonResponse
    {
        $this->authorize('view', $booking);

        if ($booking->status !== BookingStatus::Accepted) {
            return response()->json([
                'message' => 'La messagerie n’est disponible qu’après acceptation de la demande.',
            ], 422);
        }

        $booking->loadMissing(['parent', 'aeshProfile.user']);

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
