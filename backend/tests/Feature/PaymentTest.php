<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\AeshProfile;
use App\Models\BookingRequest;
use App\Models\Modality;
use App\Models\Payment;
use App\Models\SchoolLevel;
use App\Models\User;
use App\Services\PaymentService;
use Database\Seeders\CountrySeeder;
use Database\Seeders\LanguageSeeder;
use Database\Seeders\ModalitySeeder;
use Database\Seeders\SchoolLevelSeeder;
use Database\Seeders\SpecializationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    private User $parent;

    private User $aeshUser;

    private AeshProfile $profile;

    protected function setUp(): void
    {
        parent::setUp();

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
            'bio' => 'Accompagnante spécialisée pour le test de paiement.',
            'timezone' => 'Europe/Paris',
            'verification_status' => AeshProfile::STATUS_PUBLISHED,
            'published_at' => now(),
        ]);

        // Seul point de contact avec le SDK Stripe : on stub la création de
        // session, le reste du service (garde-fous, ligne Payment) tourne
        // pour de vrai. Voir PaymentService::createStripeSession().
        $this->mock(PaymentService::class, function ($mock) {
            $mock->makePartial();
            $mock->shouldAllowMockingProtectedMethods();
            $mock->shouldReceive('createStripeSession')
                ->andReturn(['cs_test_fake_123', 'https://checkout.stripe.com/c/pay/cs_test_fake_123']);
        });
    }

    private function makeBooking(string $status): BookingRequest
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
            'responded_at' => $status !== BookingStatus::Requested->value ? now() : null,
        ]);
    }

    public function test_le_parent_obtient_une_session_de_paiement(): void
    {
        $booking = $this->makeBooking(BookingStatus::Accepted->value);

        $response = $this->actingAs($this->parent)
            ->postJson("/api/bookings/{$booking->id}/pay")
            ->assertStatus(201);

        $response->assertJsonPath('checkout_url', 'https://checkout.stripe.com/c/pay/cs_test_fake_123');

        $this->assertDatabaseHas('payments', [
            'booking_request_id' => $booking->id,
            'stripe_checkout_session_id' => 'cs_test_fake_123',
            'status' => Payment::STATUS_PENDING,
        ]);
    }

    public function test_le_montant_vient_de_la_configuration_pas_dun_tarif_stocke(): void
    {
        config(['services.stripe.platform_fee_amount' => 3500]);
        $booking = $this->makeBooking(BookingStatus::Accepted->value);

        $this->actingAs($this->parent)->postJson("/api/bookings/{$booking->id}/pay")->assertStatus(201);

        $this->assertDatabaseHas('payments', ['booking_request_id' => $booking->id, 'amount' => 3500]);
    }

    public function test_une_demande_non_acceptee_ne_peut_pas_etre_payee(): void
    {
        foreach ([BookingStatus::Requested, BookingStatus::Declined, BookingStatus::Cancelled] as $status) {
            $booking = $this->makeBooking($status->value);

            $this->actingAs($this->parent)
                ->postJson("/api/bookings/{$booking->id}/pay")
                ->assertStatus(422);
        }
    }

    public function test_une_demande_deja_payee_ne_peut_pas_etre_payee_deux_fois(): void
    {
        $booking = $this->makeBooking(BookingStatus::Accepted->value);
        Payment::create([
            'booking_request_id' => $booking->id,
            'stripe_checkout_session_id' => 'cs_test_deja_paye',
            'amount' => 2000,
            'status' => Payment::STATUS_PAID,
            'paid_at' => now(),
        ]);

        $this->actingAs($this->parent)
            ->postJson("/api/bookings/{$booking->id}/pay")
            ->assertStatus(422);
    }

    public function test_un_paiement_pending_abandonne_nempeche_pas_un_nouvel_essai(): void
    {
        $booking = $this->makeBooking(BookingStatus::Accepted->value);
        Payment::create([
            'booking_request_id' => $booking->id,
            'stripe_checkout_session_id' => 'cs_test_abandonne',
            'amount' => 2000,
            'status' => Payment::STATUS_PENDING,
        ]);

        $this->actingAs($this->parent)
            ->postJson("/api/bookings/{$booking->id}/pay")
            ->assertStatus(201);

        $this->assertDatabaseCount('payments', 2);
    }

    public function test_l_aes_h_ne_peut_pas_payer(): void
    {
        $booking = $this->makeBooking(BookingStatus::Accepted->value);

        $this->actingAs($this->aeshUser)
            ->postJson("/api/bookings/{$booking->id}/pay")
            ->assertStatus(403);
    }

    public function test_un_tiers_ne_peut_pas_payer_la_demande_dun_autre_parent(): void
    {
        $booking = $this->makeBooking(BookingStatus::Accepted->value);
        $intrus = User::factory()->create(['role' => 'parent']);

        $this->actingAs($intrus)
            ->postJson("/api/bookings/{$booking->id}/pay")
            ->assertStatus(403);
    }

    public function test_visiteur_non_authentifie_refuse(): void
    {
        $booking = $this->makeBooking(BookingStatus::Accepted->value);

        $this->postJson("/api/bookings/{$booking->id}/pay")->assertStatus(401);
    }
}
