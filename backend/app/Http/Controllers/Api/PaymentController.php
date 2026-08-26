<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BookingRequest;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private readonly PaymentService $payments) {}

    /**
     * Confirme la demande — via Stripe Checkout ou directement selon la
     * configuration du frais de mise en relation. Réservé au parent auteur.
     */
    public function store(Request $request, BookingRequest $booking): JsonResponse
    {
        $this->authorize('pay', $booking);

        $result = $this->payments->createCheckoutSession($booking, $request->user());

        return response()->json(['checkout_url' => $result['checkout_url']], 201);
    }
}
