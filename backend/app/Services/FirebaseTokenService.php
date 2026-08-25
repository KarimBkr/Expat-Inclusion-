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
     *
     * Ne porte que l'identité : l'accès aux conversations est vérifié par les
     * Security Rules directement sur `participant_ids`, sans claim. Un claim
     * listant les conversations autorisées grossirait avec le nombre de
     * demandes acceptées et dépasserait la limite Firebase de 1000 octets au
     * bout d'une soixantaine de demandes — un risque qu'on élimine en ne
     * transportant plus cette liste du tout, plutôt qu'en la plafonnant.
     *
     * @return array{token: string, uid: string}
     */
    public function issueFor(User $user): array
    {
        $token = $this->auth->createCustomToken((string) $user->id, [
            'role' => $user->role,
        ]);

        return [
            'token' => $token->toString(),
            'uid' => (string) $user->id,
        ];
    }

    /**
     * Demandes ouvrant droit à une conversation pour cet utilisateur : celles
     * qui ont un jour été acceptées, même si elles ont depuis été annulées —
     * l'historique des échanges ne doit pas disparaître avec le statut.
     *
     * @return Collection<int, BookingRequest>
     */
    public function conversableBookingsFor(User $user): Collection
    {
        $query = BookingRequest::query()
            ->whereHas('statusHistories', fn ($q) => $q->where('to_status', BookingStatus::Accepted))
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
