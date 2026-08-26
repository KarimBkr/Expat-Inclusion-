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

    /**
     * Seul le parent auteur paie le frais de mise en relation — l'AESH ne
     * paie jamais rien via la plateforme. La légalité de la transition
     * (demande bien acceptée, pas déjà payée) est vérifiée par
     * `PaymentService`, pas ici.
     */
    public function pay(User $user, BookingRequest $booking): bool
    {
        return $this->isAuthor($user, $booking);
    }

    /**
     * La messagerie reste ouverte tant que la demande a un jour été acceptée —
     * y compris après une annulation ultérieure : l'historique des échanges
     * ne doit pas disparaître parce que la réservation a changé de statut.
     * Une demande refusée ou annulée avant toute acceptation n'a jamais eu
     * de conversation et ne doit pas pouvoir en obtenir une a posteriori.
     */
    public function converse(User $user, BookingRequest $booking): bool
    {
        return ($this->isAuthor($user, $booking) || $this->isRecipient($user, $booking))
            && $booking->wasAccepted();
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
