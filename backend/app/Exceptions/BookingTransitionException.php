<?php

namespace App\Exceptions;

use App\Enums\BookingStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

/** Transition de statut refusée par la machine à états (US-12). */
class BookingTransitionException extends RuntimeException
{
    public static function from(BookingStatus $current, BookingStatus $target): self
    {
        return new self(sprintf(
            'Transition impossible : une demande « %s » ne peut pas passer à « %s ».',
            $current->label(),
            $target->label(),
        ));
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 422);
    }
}
