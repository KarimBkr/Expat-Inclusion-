<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;
use UnexpectedValueException;

/**
 * Reçoit les événements Stripe (US-15). Route publique — la légitimité de
 * l'appel n'est pas garantie par Sanctum mais par la signature HMAC du corps
 * de la requête, vérifiée avec le secret de webhook Stripe.
 */
class StripeWebhookController extends Controller
{
    public function __construct(private readonly PaymentService $payments) {}

    public function handle(Request $request): JsonResponse
    {
        try {
            $event = Webhook::constructEvent(
                $request->getContent(),
                (string) $request->header('Stripe-Signature'),
                (string) config('services.stripe.webhook_secret'),
            );
        } catch (UnexpectedValueException|SignatureVerificationException) {
            return response()->json(['message' => 'Signature invalide.'], 400);
        }

        if ($event->type === 'checkout.session.completed') {
            $this->payments->confirmFromSession($event->data->object);
        }

        // 200 pour tout événement reconnu ou non : Stripe interprète un code
        // d'erreur comme une invitation à réessayer indéfiniment. Seule une
        // signature invalide justifie un refus explicite.
        return response()->json(['received' => true]);
    }
}
