<?php

namespace App\Enums;

/**
 * Machine à états d'une demande de réservation (US-12 + US-14/US-15).
 *
 *   requested ──► accepted ──┬──► cancelled (terminal)
 *        │                   └──► confirmed (terminal — voir note remboursement)
 *        ├──────────────────────► declined  (terminal)
 *        └──────────────────────► cancelled (terminal)
 *
 * `confirmed` n'est atteint que via le webhook de paiement (US-15), jamais
 * par une action utilisateur directe — voir `BookingRequestPolicy`, qui
 * n'expose aucune capacité de déclencher cette transition.
 *
 * `confirmed` est terminal : annuler une demande déjà payée impliquerait un
 * remboursement, hors périmètre de US-14/US-15. Une demande payée qui doit
 * être annulée se traite pour l'instant manuellement (tableau de bord
 * Stripe), pas via l'application.
 */
enum BookingStatus: string
{
    case Requested = 'requested';
    case Accepted = 'accepted';
    case Declined = 'declined';
    case Cancelled = 'cancelled';
    case Confirmed = 'confirmed';

    /** @return array<int, self> */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Requested => [self::Accepted, self::Declined, self::Cancelled],
            self::Accepted => [self::Cancelled, self::Confirmed],
            self::Declined, self::Cancelled, self::Confirmed => [],
        };
    }

    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->allowedTransitions(), true);
    }

    public function isFinal(): bool
    {
        return $this->allowedTransitions() === [];
    }

    public function label(): string
    {
        return match ($this) {
            self::Requested => 'En attente de réponse',
            self::Accepted => 'Acceptée',
            self::Declined => 'Refusée',
            self::Cancelled => 'Annulée',
            self::Confirmed => 'Confirmée (payée)',
        };
    }
}
