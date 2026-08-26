<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Models\BookingRequest;
use App\Models\Payment;
use Illuminate\Validation\ValidationException;
use Stripe\Checkout\Session;
use Stripe\StripeClient;

/**
 * Paiement du frais de mise en relation (US-14) — jamais du tarif de l'AESH,
 * qui n'est ni stocké ni transporté par la plateforme depuis le retrait du
 * tarif horaire. L'argent ne transite jamais vers l'AESH : pas de Stripe
 * Connect, pas de reversement — décisions figées du projet.
 */
class PaymentService
{
    public function __construct(
        private readonly StripeClient $stripe,
        private readonly BookingRequestService $bookings,
    ) {}

    /**
     * Crée une session Stripe Checkout pour une demande acceptée.
     *
     * Une demande ne peut être payée qu'une fois : si un paiement `paid`
     * existe déjà, la création est refusée plutôt que de facturer deux fois.
     * Un paiement `pending` abandonné n'empêche pas d'en créer un nouveau —
     * les sessions Checkout expirent d'elles-mêmes côté Stripe.
     *
     * @return array{payment: Payment, checkout_url: string}
     */
    public function createCheckoutSession(BookingRequest $booking): array
    {
        if ($booking->status !== BookingStatus::Accepted) {
            throw ValidationException::withMessages([
                'booking' => 'Seule une demande acceptée peut être payée.',
            ]);
        }

        if ($booking->payments()->where('status', Payment::STATUS_PAID)->exists()) {
            throw ValidationException::withMessages([
                'booking' => 'Cette demande a déjà été payée.',
            ]);
        }

        $amount = (int) config('services.stripe.platform_fee_amount');
        $currency = (string) config('services.stripe.currency');

        [$sessionId, $checkoutUrl] = $this->createStripeSession($booking, $amount, $currency);

        $payment = Payment::create([
            'booking_request_id' => $booking->id,
            'stripe_checkout_session_id' => $sessionId,
            'amount' => $amount,
            'currency' => $currency,
            'status' => Payment::STATUS_PENDING,
        ]);

        return ['payment' => $payment, 'checkout_url' => $checkoutUrl];
    }

    /**
     * Seul point de contact avec le SDK Stripe pour la création de session —
     * `StripeClient` expose `checkout`/`sessions` via des propriétés
     * magiques (`__get`), peu pratiques à substituer avec Mockery sur la
     * classe entière. Isoler l'appel ici permet aux tests de ne stubber que
     * ce point précis et de faire tourner pour de vrai le reste du service
     * (garde-fous, création de la ligne `Payment`).
     *
     * @return array{0: string, 1: string} identifiant et URL de la session
     */
    protected function createStripeSession(BookingRequest $booking, int $amount, string $currency): array
    {
        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');

        $session = $this->stripe->checkout->sessions->create([
            'mode' => 'payment',
            'payment_method_types' => ['card'],
            'client_reference_id' => (string) $booking->id,
            'metadata' => ['booking_request_id' => (string) $booking->id],
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => $currency,
                    'unit_amount' => $amount,
                    'product_data' => [
                        'name' => 'Frais de mise en relation Expat Inclusion',
                        'description' => "Demande de réservation #{$booking->id}",
                    ],
                ],
            ]],
            'success_url' => "{$frontendUrl}/dashboard/parent/paiement/succes?booking={$booking->id}",
            'cancel_url' => "{$frontendUrl}/dashboard/parent/paiement/annule?booking={$booking->id}",
        ]);

        return [$session->id, $session->url];
    }

    /**
     * Confirme un paiement à partir d'un événement webhook
     * `checkout.session.completed` (US-15). Idempotent : un événement rejoué
     * par Stripe sur un paiement déjà `paid` ne fait rien — c'est le
     * comportement attendu, pas une erreur.
     */
    public function confirmFromSession(Session $session): void
    {
        $payment = Payment::where('stripe_checkout_session_id', $session->id)->first();

        if ($payment === null || $payment->isPaid()) {
            return;
        }

        $payment->update([
            'status' => Payment::STATUS_PAID,
            'stripe_payment_intent_id' => is_string($session->payment_intent) ? $session->payment_intent : null,
            'paid_at' => now(),
        ]);

        $booking = $payment->bookingRequest;

        if ($booking->status === BookingStatus::Accepted) {
            $this->bookings->transition($booking, BookingStatus::Confirmed, null);
        }
    }
}
