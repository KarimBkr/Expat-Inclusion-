<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BookingRequest;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    public function __construct(private readonly PaymentService $payments) {}

    /**
     * Crée une session Stripe Checkout pour la demande. Réservé au parent
     * auteur — payer la mise en relation lui revient, pas à l'AESH.
     */
    public function store(BookingRequest $booking): JsonResponse
    {
        $this->authorize('pay', $booking);

        $result = $this->payments->createCheckoutSession($booking);

        return response()->json(['checkout_url' => $result['checkout_url']], 201);
    }
}
