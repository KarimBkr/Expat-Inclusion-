<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Exceptions\BookingTransitionException;
use App\Models\AeshProfile;
use App\Models\BookingRequest;
use App\Models\User;
use App\Notifications\BookingRequestAcceptedNotification;
use App\Notifications\BookingRequestCancelledNotification;
use App\Notifications\BookingRequestDeclinedNotification;
use App\Notifications\BookingRequestReceivedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
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

        $booking = DB::transaction(function () use ($data, $parent, $profile): BookingRequest {
            $booking = BookingRequest::create([
                'parent_id'       => $parent->id,
                'aesh_profile_id' => $profile->id,
                'status'          => BookingStatus::Requested,
                'message'         => $data['message'],
                'modality_id'     => $data['modality_id'],
                'school_level_id' => $data['school_level_id'],
                'start_date'      => $data['start_date'],
                'hours_per_week'  => $data['hours_per_week'],
            ]);

            $this->recordHistory($booking, null, BookingStatus::Requested, $parent);

            return $booking;
        });

        $booking->loadMissing(['parent', 'aeshProfile.user']);
        Notification::send($booking->aeshProfile->user, new BookingRequestReceivedNotification($booking));

        return $booking;
    }

    /**
     * Applique une transition de statut en respectant la machine à états.
     * L'autorisation (qui a le droit de déclencher quoi) est vérifiée en amont
     * par la policy — ce service ne juge que la légalité de la transition.
     */
    public function transition(
        BookingRequest $booking,
        BookingStatus $target,
        User $actor,
        ?string $reason = null,
    ): BookingRequest {
        $current = $booking->status;

        if (! $current->canTransitionTo($target)) {
            throw BookingTransitionException::from($current, $target);
        }

        $booking = DB::transaction(function () use ($booking, $current, $target, $actor, $reason): BookingRequest {
            $booking->update([
                'status'          => $target,
                'response_reason' => $reason,
                'responded_at'    => now(),
            ]);

            $this->recordHistory($booking, $current, $target, $actor, $reason);

            return $booking->refresh();
        });

        $booking->loadMissing(['parent', 'aeshProfile.user']);
        $this->notifyTransition($booking, $target, $actor, $reason);

        return $booking;
    }

    /** Prévient la partie concernée par la nouvelle étape de la demande. */
    private function notifyTransition(BookingRequest $booking, BookingStatus $target, User $actor, ?string $reason): void
    {
        match ($target) {
            BookingStatus::Accepted => Notification::send($booking->parent, new BookingRequestAcceptedNotification($booking)),
            BookingStatus::Declined => Notification::send($booking->parent, new BookingRequestDeclinedNotification($booking, $reason)),
            BookingStatus::Cancelled => Notification::send(
                $this->otherParty($booking, $actor),
                new BookingRequestCancelledNotification($booking, $reason),
            ),
            BookingStatus::Requested => null,
        };
    }

    /** L'autre partie que celle qui vient d'agir — jamais l'acteur lui-même. */
    private function otherParty(BookingRequest $booking, User $actor): User
    {
        return $actor->id === $booking->parent_id
            ? $booking->aeshProfile->user
            : $booking->parent;
    }

    private function recordHistory(
        BookingRequest $booking,
        ?BookingStatus $from,
        BookingStatus $to,
        User $actor,
        ?string $reason = null,
    ): void {
        $booking->statusHistories()->create([
            'from_status' => $from,
            'to_status'   => $to,
            'changed_by'  => $actor->id,
            'reason'      => $reason,
        ]);
    }
}
