<?php

namespace App\Enums;

/**
 * Machine à états d'une demande de réservation (US-12).
 *
 *   requested ──► accepted ──► cancelled
 *        │  └───► declined  (terminal)
 *        └──────► cancelled (terminal)
 *
 * `declined` et `cancelled` sont terminaux : aucune sortie possible.
 */
enum BookingStatus: string
{
    case Requested = 'requested';
    case Accepted = 'accepted';
    case Declined = 'declined';
    case Cancelled = 'cancelled';

    /** @return array<int, self> */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Requested => [self::Accepted, self::Declined, self::Cancelled],
            self::Accepted  => [self::Cancelled],
            self::Declined, self::Cancelled => [],
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
            self::Accepted  => 'Acceptée',
            self::Declined  => 'Refusée',
            self::Cancelled => 'Annulée',
        };
    }
}
