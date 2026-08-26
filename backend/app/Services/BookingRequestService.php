<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Exceptions\BookingTransitionException;
use App\Models\AeshProfile;
use App\Models\BookingRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingRequestService
{
    /**
     * Crée une demande de réservation sur un profil AESH publié.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $parent): BookingRequest
    {
        $profile = AeshProfile::published()->find($data['aesh_profile_id']);

        if ($profile === null) {
            throw ValidationException::withMessages([
                'aesh_profile_id' => 'Cet accompagnant n’est pas disponible à la réservation.',
            ]);
        }

        $alreadyPending = BookingRequest::pending()
            ->where('parent_id', $parent->id)
            ->where('aesh_profile_id', $profile->id)
            ->exists();

        if ($alreadyPending) {
            throw ValidationException::withMessages([
                'aesh_profile_id' => 'Vous avez déjà une demande en attente auprès de cet accompagnant.',
            ]);
        }

        return DB::transaction(function () use ($data, $parent, $profile): BookingRequest {
            $booking = BookingRequest::create([
                'parent_id' => $parent->id,
                'aesh_profile_id' => $profile->id,
                'status' => BookingStatus::Requested,
                'message' => $data['message'],
                'modality_id' => $data['modality_id'],
                'school_level_id' => $data['school_level_id'],
                'start_date' => $data['start_date'],
                'hours_per_week' => $data['hours_per_week'],
            ]);

            $this->recordHistory($booking, null, BookingStatus::Requested, $parent);

            return $booking;
        });
    }

    /**
     * Applique une transition de statut en respectant la machine à états.
     * L'autorisation (qui a le droit de déclencher quoi) est vérifiée en amont
     * par la policy — ce service ne juge que la légalité de la transition.
     *
     * `$actor` est nullable pour la seule transition vers `Confirmed` : elle
     * est déclenchée par le webhook de paiement (US-15), sans utilisateur
     * Laravel authentifié à l'origine.
     */
    public function transition(
        BookingRequest $booking,
        BookingStatus $target,
        ?User $actor,
        ?string $reason = null,
    ): BookingRequest {
        $current = $booking->status;

        if (! $current->canTransitionTo($target)) {
            throw BookingTransitionException::from($current, $target);
        }

        return DB::transaction(function () use ($booking, $current, $target, $actor, $reason): BookingRequest {
            $updates = ['status' => $target];

            // response_reason/responded_at documentent la réponse de l'AESH
            // (acceptation, refus) ou le motif d'une annulation — pas la
            // confirmation de paiement, qui n'en a pas et ne doit pas écraser
            // la date de réponse déjà enregistrée à l'acceptation.
            if ($target !== BookingStatus::Confirmed) {
                $updates['response_reason'] = $reason;
                $updates['responded_at'] = now();
            }

            $booking->update($updates);

            $this->recordHistory($booking, $current, $target, $actor, $reason);

            return $booking->refresh();
        });
    }

    private function recordHistory(
        BookingRequest $booking,
        ?BookingStatus $from,
        BookingStatus $to,
        ?User $actor,
        ?string $reason = null,
    ): void {
        $booking->statusHistories()->create([
            'from_status' => $from,
            'to_status' => $to,
            'changed_by' => $actor?->id,
            'reason' => $reason,
        ]);
    }
}
