<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\AeshProfile;
use App\Models\BookingRequest;
use App\Models\Modality;
use App\Models\Payment;
use App\Models\SchoolLevel;
use App\Models\User;
use Database\Seeders\CountrySeeder;
use Database\Seeders\LanguageSeeder;
use Database\Seeders\ModalitySeeder;
use Database\Seeders\SchoolLevelSeeder;
use Database\Seeders\SpecializationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Signature construite localement avec le même algorithme que Stripe
 * (HMAC-SHA256 sur "{timestamp}.{payload}", voir WebhookSignature::verifyHeader
 * dans le SDK) — un vrai test de la vérification, pas un mock qui la
 * contournerait.
 */
class StripeWebhookTest extends TestCase
{
    use RefreshDatabase;

    private const WEBHOOK_SECRET = 'whsec_test_fake_secret';

    private User $parent;

    private User $aeshUser;

    private AeshProfile $profile;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.stripe.webhook_secret' => self::WEBHOOK_SECRET]);

        $this->seed([
            CountrySeeder::class,
            SpecializationSeeder::class,
            LanguageSeeder::class,
            SchoolLevelSeeder::class,
            ModalitySeeder::class,
        ]);

        $this->parent = User::factory()->create(['role' => 'parent']);
        $this->aeshUser = User::factory()->create(['role' => 'aesh']);
        $this->profile = AeshProfile::create([
            'user_id' => $this->aeshUser->id,
            'bio' => 'Accompagnante spécialisée pour le test webhook.',
            'timezone' => 'Europe/Paris',
            'verification_status' => AeshProfile::STATUS_PUBLISHED,
            'published_at' => now(),
        ]);
    }

    private function makeBooking(string $status = BookingStatus::Accepted->value): BookingRequest
    {
        return BookingRequest::create([
            'parent_id' => $this->parent->id,
            'aesh_profile_id' => $this->profile->id,
            'status' => $status,
            'message' => 'Nous cherchons un accompagnement.',
            'modality_id' => Modality::first()->id,
            'school_level_id' => SchoolLevel::first()->id,
            'start_date' => now()->addWeek()->toDateString(),
            'hours_per_week' => 6,
            'responded_at' => now(),
        ]);
    }

    private function makePayment(BookingRequest $booking, string $sessionId, string $status = Payment::STATUS_PENDING): Payment
    {
        return Payment::create([
            'booking_request_id' => $booking->id,
            'stripe_checkout_session_id' => $sessionId,
            'amount' => 2000,
            'status' => $status,
        ]);
    }

    /** @return array{0: string, 1: string} le corps JSON et l'en-tête de signature valide */
    private function signedPayload(array $eventPayload): array
    {
        $payload = json_encode($eventPayload);
        $timestamp = time();
        $signature = hash_hmac('sha256', "{$timestamp}.{$payload}", self::WEBHOOK_SECRET);

        return [$payload, "t={$timestamp},v1={$signature}"];
    }

    private function checkoutCompletedEvent(string $sessionId, ?string $paymentIntentId = 'pi_test_123'): array
    {
        return [
            'id' => 'evt_test_'.uniqid(),
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => $sessionId,
                    'object' => 'checkout.session',
                    'payment_intent' => $paymentIntentId,
                ],
            ],
        ];
    }

    private function postWebhook(string $payload, string $signature)
    {
        return $this->call(
            'POST',
            '/api/stripe/webhook',
            parameters: [],
            cookies: [],
            files: [],
            server: ['HTTP_Stripe-Signature' => $signature, 'CONTENT_TYPE' => 'application/json'],
            content: $payload,
        );
    }

    public function test_confirme_le_paiement_et_la_demande_sur_evenement_valide(): void
    {
        $booking = $this->makeBooking();
        $this->makePayment($booking, 'cs_test_ok');

        [$payload, $signature] = $this->signedPayload($this->checkoutCompletedEvent('cs_test_ok'));

        $this->postWebhook($payload, $signature)->assertOk();

        $this->assertDatabaseHas('payments', [
            'stripe_checkout_session_id' => 'cs_test_ok',
            'status' => Payment::STATUS_PAID,
            'stripe_payment_intent_id' => 'pi_test_123',
        ]);
        $this->assertSame(BookingStatus::Confirmed, $booking->refresh()->status);
    }

    public function test_enregistre_lhistorique_sans_acteur_humain(): void
    {
        $booking = $this->makeBooking();
        $this->makePayment($booking, 'cs_test_historique');
        [$payload, $signature] = $this->signedPayload($this->checkoutCompletedEvent('cs_test_historique'));

        $this->postWebhook($payload, $signature)->assertOk();

        $this->assertDatabaseHas('booking_status_histories', [
            'booking_request_id' => $booking->id,
            'from_status' => 'accepted',
            'to_status' => 'confirmed',
            'changed_by' => null,
        ]);
    }

    public function test_signature_invalide_refusee(): void
    {
        $booking = $this->makeBooking();
        $this->makePayment($booking, 'cs_test_signature');
        $payload = json_encode($this->checkoutCompletedEvent('cs_test_signature'));

        $this->postWebhook($payload, 't='.time().',v1=signature_bidon')->assertStatus(400);

        $this->assertDatabaseHas('payments', ['stripe_checkout_session_id' => 'cs_test_signature', 'status' => Payment::STATUS_PENDING]);
    }

    public function test_evenement_rejoue_sur_paiement_deja_confirme_est_un_no_op(): void
    {
        $booking = $this->makeBooking();
        $payment = $this->makePayment($booking, 'cs_test_idempotent', Payment::STATUS_PAID);
        $payment->update(['paid_at' => now()->subHour(), 'stripe_payment_intent_id' => 'pi_original']);

        [$payload, $signature] = $this->signedPayload($this->checkoutCompletedEvent('cs_test_idempotent', 'pi_rejoue'));

        $this->postWebhook($payload, $signature)->assertOk();

        // Le paiement rejoué ne doit rien modifier : ni le payment_intent
        // d'origine, ni redéclencher une transition (déjà confirmed).
        $this->assertDatabaseHas('payments', [
            'stripe_checkout_session_id' => 'cs_test_idempotent',
            'stripe_payment_intent_id' => 'pi_original',
        ]);
        $this->assertDatabaseCount('booking_status_histories', 0);
    }

    public function test_session_inconnue_ne_fait_planter_rien(): void
    {
        [$payload, $signature] = $this->signedPayload($this->checkoutCompletedEvent('cs_test_jamais_cree'));

        $this->postWebhook($payload, $signature)->assertOk();
    }

    public function test_type_devenement_non_gere_est_accepte_sans_effet(): void
    {
        [$payload, $signature] = $this->signedPayload([
            'id' => 'evt_test_autre',
            'type' => 'payment_intent.created',
            'data' => ['object' => ['id' => 'pi_sans_rapport']],
        ]);

        $this->postWebhook($payload, $signature)->assertOk();
    }

    public function test_ne_transitionne_pas_une_demande_qui_nest_plus_accepted(): void
    {
        $booking = $this->makeBooking(BookingStatus::Cancelled->value);
        $this->makePayment($booking, 'cs_test_deja_annulee');

        [$payload, $signature] = $this->signedPayload($this->checkoutCompletedEvent('cs_test_deja_annulee'));

        $this->postWebhook($payload, $signature)->assertOk();

        $this->assertDatabaseHas('payments', ['stripe_checkout_session_id' => 'cs_test_deja_annulee', 'status' => Payment::STATUS_PAID]);
        $this->assertSame(BookingStatus::Cancelled, $booking->refresh()->status);
    }

    public function test_route_accessible_sans_session_sanctum(): void
    {
        $booking = $this->makeBooking();
        $this->makePayment($booking, 'cs_test_public');
        [$payload, $signature] = $this->signedPayload($this->checkoutCompletedEvent('cs_test_public'));

        // Pas de actingAs() ici : Stripe appelle sans cookie de session.
        $this->postWebhook($payload, $signature)->assertOk();
    }
}
