<?php

namespace App\Policies;

use App\Models\BookingRequest;
use App\Models\User;

class BookingRequestPolicy
{
    /** Le parent auteur et l'AESH destinataire voient la demande. */
    public function view(User $user, BookingRequest $booking): bool
    {
        return $this->isAuthor($user, $booking) || $this->isRecipient($user, $booking);
    }

    /** Seul l'AESH destinataire répond à une demande (accepter / refuser). */
    public function respond(User $user, BookingRequest $booking): bool
    {
        return $this->isRecipient($user, $booking);
    }

    /** Les deux parties peuvent annuler une demande qui les concerne. */
    public function cancel(User $user, BookingRequest $booking): bool
    {
        return $this->isAuthor($user, $booking) || $this->isRecipient($user, $booking);
    }

    private function isAuthor(User $user, BookingRequest $booking): bool
    {
        return $user->isParent() && $booking->parent_id === $user->id;
    }

    private function isRecipient(User $user, BookingRequest $booking): bool
    {
        return $user->isAesh() && $booking->aeshProfile?->user_id === $user->id;
    }
}
