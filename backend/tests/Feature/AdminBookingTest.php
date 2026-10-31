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

class AdminBookingTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $parent;

    private AeshProfile $profile;

    private BookingRequest $booking;

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

        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->parent = User::factory()->create(['role' => 'parent']);
        $aeshUser = User::factory()->create(['role' => 'aesh']);
        $this->profile = AeshProfile::create([
            'user_id'             => $aeshUser->id,
            'bio'                 => 'AESH expatriée.',
            'verification_status' => AeshProfile::STATUS_PUBLISHED,
        ]);

        $this->booking = BookingRequest::create([
            'parent_id'       => $this->parent->id,
            'aesh_profile_id' => $this->profile->id,
            'status'          => BookingStatus::Accepted->value,
            'message'         => 'Nous cherchons un accompagnement pour notre fils.',
            'modality_id'     => Modality::first()->id,
            'school_level_id' => SchoolLevel::first()->id,
            'start_date'      => now()->addWeek()->toDateString(),
            'hours_per_week'  => 6,
        ]);
    }

    public function test_admin_peut_lister_toutes_les_demandes(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/admin/bookings')
            ->assertOk()
            ->assertJsonPath('data.0.id', $this->booking->id)
            ->assertJsonPath('data.0.parent.email', $this->parent->email);
    }

    public function test_admin_peut_filtrer_par_statut(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/admin/bookings?status=accepted')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($this->admin)
            ->getJson('/api/admin/bookings?status=declined')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_le_detail_expose_le_paiement_et_l_historique(): void
    {
        Payment::create([
            'booking_request_id'          => $this->booking->id,
            'stripe_checkout_session_id'  => 'cs_test_123',
            'amount'                      => 4900,
            'status'                      => Payment::STATUS_PAID,
            'paid_at'                     => now(),
        ]);

        $this->actingAs($this->admin)
            ->getJson("/api/admin/bookings/{$this->booking->id}")
            ->assertOk()
            ->assertJsonPath('data.payments.0.amount', 4900)
            ->assertJsonPath('data.payments.0.status', 'paid');
    }

    public function test_le_detail_signale_les_frais_desactives(): void
    {
        config(['services.stripe.platform_fee_enabled' => false]);

        $this->actingAs($this->admin)
            ->getJson("/api/admin/bookings/{$this->booking->id}")
            ->assertOk()
            ->assertJsonPath('data.payments_enabled', false);
    }

    public function test_admin_peut_ajouter_une_note_sur_une_demande(): void
    {
        $this->actingAs($this->admin)
            ->postJson("/api/admin/bookings/{$this->booking->id}/notes", [
                'body' => 'Parent injoignable, à relancer.',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.body', 'Parent injoignable, à relancer.');

        $this->assertDatabaseHas('admin_notes', [
            'booking_request_id' => $this->booking->id,
            'aesh_profile_id'    => null,
        ]);
    }

    public function test_parent_ne_peut_pas_acceder_au_cockpit_reservations(): void
    {
        $this->actingAs($this->parent)
            ->getJson('/api/admin/bookings')
            ->assertStatus(403);
    }

    public function test_aesh_ne_peut_pas_acceder_au_cockpit_reservations(): void
    {
        $aesh = User::factory()->create(['role' => 'aesh']);

        $this->actingAs($aesh)
            ->getJson("/api/admin/bookings/{$this->booking->id}")
            ->assertStatus(403);
    }
}
