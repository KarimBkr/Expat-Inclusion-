<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Models\BookingRequest;
use App\Models\User;
use Illuminate\Support\Collection;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;

class FirebaseTokenService
{
    public function __construct(private readonly FirebaseAuth $auth) {}

    /**
     * Émet un custom token Firebase pour l'utilisateur Laravel.
     * Les claims `allowed_conversations` limitent l'accès Firestore aux
     * threads des demandes acceptées dont l'utilisateur est participant.
     *
     * @return array{token: string, uid: string, allowed_conversations: list<string>}
     */
    public function issueFor(User $user): array
    {
        $allowed = $this->allowedConversationIds($user);

        $token = $this->auth->createCustomToken((string) $user->id, [
            'role' => $user->role,
            'allowed_conversations' => $allowed,
        ]);

        return [
            'token' => $token->toString(),
            'uid' => (string) $user->id,
            'allowed_conversations' => $allowed,
        ];
    }

    /** @return list<string> */
    private function allowedConversationIds(User $user): array
    {
        return $this->acceptedBookingsFor($user)
            ->map(fn (BookingRequest $booking): string => self::conversationId($booking->id))
            ->values()
            ->all();
    }

    /** @return Collection<int, BookingRequest> */
    public function acceptedBookingsFor(User $user): Collection
    {
        $query = BookingRequest::query()
            ->where('status', BookingStatus::Accepted)
            ->with(['parent', 'aeshProfile.user'])
            ->latest();

        if ($user->isParent()) {
            $query->where('parent_id', $user->id);
        } elseif ($user->isAesh()) {
            $query->whereHas('aeshProfile', fn ($q) => $q->where('user_id', $user->id));
        } else {
            return collect();
        }

        return $query->get();
    }

    public static function conversationId(int $bookingId): string
    {
        return 'booking_'.$bookingId;
    }
}
