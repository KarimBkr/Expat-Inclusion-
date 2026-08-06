<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\AeshProfile;
use App\Models\BookingRequest;
use App\Models\Modality;
use App\Models\SchoolLevel;
use App\Models\User;
use Database\Seeders\CountrySeeder;
use Database\Seeders\LanguageSeeder;
use Database\Seeders\ModalitySeeder;
use Database\Seeders\SchoolLevelSeeder;
use Database\Seeders\SpecializationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingRequestTest extends TestCase
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
        $this->profile = $this->makeProfile($this->aeshUser, AeshProfile::STATUS_PUBLISHED);
    }

    private function makeProfile(User $user, string $status, float $rate = 35): AeshProfile
    {
        return AeshProfile::create([
            'user_id'             => $user->id,
            'bio'                 => 'Accompagnante spécialisée avec une solide expérience de terrain.',
            'hourly_rate'         => $rate,
            'timezone'            => 'Europe/Paris',
            'verification_status' => $status,
            'published_at'        => $status === AeshProfile::STATUS_PUBLISHED ? now() : null,
        ]);
    }

    /** @return array<string, mixed> */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'aesh_profile_id' => $this->profile->id,
            'message'         => 'Nous cherchons un accompagnement pour notre fils scolarisé au lycée français.',
            'modality_id'     => Modality::first()->id,
            'school_level_id' => SchoolLevel::first()->id,
            'start_date'      => now()->addWeek()->toDateString(),
            'hours_per_week'  => 6,
        ], $overrides);
    }

    private function makeBooking(string $status = BookingStatus::Requested->value): BookingRequest
    {
        return BookingRequest::create([
            'parent_id'       => $this->parent->id,
            'aesh_profile_id' => $this->profile->id,
            'status'          => $status,
            'message'         => 'Nous cherchons un accompagnement pour notre fils.',
            'modality_id'     => Modality::first()->id,
            'school_level_id' => SchoolLevel::first()->id,
            'start_date'      => now()->addWeek()->toDateString(),
            'hours_per_week'  => 6,
            'hourly_rate'     => 35,
        ]);
    }

    // ── US-11 · création ──────────────────────────────────────────────────────

    public function test_un_parent_cree_une_demande(): void
    {
        $this->actingAs($this->parent)
            ->postJson('/api/bookings', $this->payload())
            ->assertStatus(201)
            ->assertJsonPath('data.status', 'requested')
            ->assertJsonPath('data.hours_per_week', 6)
            ->assertJsonPath('data.aesh.id', $this->profile->id);

        $this->assertDatabaseHas('booking_requests', [
            'parent_id'       => $this->parent->id,
            'aesh_profile_id' => $this->profile->id,
            'status'          => 'requested',
        ]);
    }

    public function test_le_tarif_est_fige_a_la_creation(): void
    {
        $this->actingAs($this->parent)->postJson('/api/bookings', $this->payload())->assertStatus(201);

        $this->profile->update(['hourly_rate' => 90]);

        $this->assertSame('35.00', BookingRequest::first()->hourly_rate);
    }

    public function test_la_creation_ecrit_une_ligne_d_historique(): void
    {
        $this->actingAs($this->parent)->postJson('/api/bookings', $this->payload())->assertStatus(201);

        $this->assertDatabaseHas('booking_status_histories', [
            'booking_request_id' => BookingRequest::first()->id,
            'from_status'        => null,
            'to_status'          => 'requested',
            'changed_by'         => $this->parent->id,
        ]);
    }

    public function test_champs_requis_valides(): void
    {
        $this->actingAs($this->parent)
            ->postJson('/api/bookings', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'aesh_profile_id', 'message', 'modality_id', 'school_level_id', 'start_date', 'hours_per_week',
            ]);
    }

    public function test_date_de_debut_dans_le_passe_refusee(): void
    {
        $this->actingAs($this->parent)
            ->postJson('/api/bookings', $this->payload(['start_date' => now()->subDay()->toDateString()]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('start_date');
    }

    public function test_impossible_de_reserver_un_profil_non_publie(): void
    {
        $other = User::factory()->create(['role' => 'aesh']);
        $draft = $this->makeProfile($other, AeshProfile::STATUS_PENDING);

        $this->actingAs($this->parent)
            ->postJson('/api/bookings', $this->payload(['aesh_profile_id' => $draft->id]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('aesh_profile_id');
    }

    public function test_pas_deux_demandes_en_attente_sur_le_meme_aesh(): void
    {
        $this->actingAs($this->parent)->postJson('/api/bookings', $this->payload())->assertStatus(201);

        $this->actingAs($this->parent)
            ->postJson('/api/bookings', $this->payload())
            ->assertStatus(422)
            ->assertJsonValidationErrors('aesh_profile_id');
    }

    public function test_nouvelle_demande_possible_apres_un_refus(): void
    {
        $booking = $this->makeBooking();
        $this->actingAs($this->aeshUser)
            ->postJson("/api/bookings/{$booking->id}/decline", ['reason' => 'Planning complet ce trimestre.'])
            ->assertOk();

        $this->actingAs($this->parent)
            ->postJson('/api/bookings', $this->payload())
            ->assertStatus(201);
    }

    public function test_un_aesh_ne_peut_pas_creer_de_demande(): void
    {
        $this->actingAs($this->aeshUser)
            ->postJson('/api/bookings', $this->payload())
            ->assertStatus(403);
    }

    public function test_visiteur_non_authentifie_refuse(): void
    {
        $this->postJson('/api/bookings', $this->payload())->assertStatus(401);
    }

    // ── US-12 · machine à états ───────────────────────────────────────────────

    public function test_aesh_accepte_une_demande(): void
    {
        $booking = $this->makeBooking();

        $this->actingAs($this->aeshUser)
            ->postJson("/api/bookings/{$booking->id}/accept")
            ->assertOk()
            ->assertJsonPath('data.status', 'accepted');

        $this->assertDatabaseHas('booking_status_histories', [
            'booking_request_id' => $booking->id,
            'from_status'        => 'requested',
            'to_status'          => 'accepted',
            'changed_by'         => $this->aeshUser->id,
        ]);
    }

    public function test_aesh_refuse_avec_motif(): void
    {
        $booking = $this->makeBooking();

        $this->actingAs($this->aeshUser)
            ->postJson("/api/bookings/{$booking->id}/decline", ['reason' => 'Je n’interviens pas dans ce pays.'])
            ->assertOk()
            ->assertJsonPath('data.status', 'declined')
            ->assertJsonPath('data.response_reason', 'Je n’interviens pas dans ce pays.');
    }

    public function test_refus_sans_motif_refuse(): void
    {
        $booking = $this->makeBooking();

        $this->actingAs($this->aeshUser)
            ->postJson("/api/bookings/{$booking->id}/decline", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('reason');
    }

    public function test_parent_annule_une_demande_en_attente(): void
    {
        $booking = $this->makeBooking();

        $this->actingAs($this->parent)
            ->postJson("/api/bookings/{$booking->id}/cancel", ['reason' => 'Nous avons trouvé une autre solution.'])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_parent_annule_une_demande_acceptee(): void
    {
        $booking = $this->makeBooking(BookingStatus::Accepted->value);

        $this->actingAs($this->parent)
            ->postJson("/api/bookings/{$booking->id}/cancel", ['reason' => 'Déménagement imprévu.'])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_aesh_annule_une_demande_acceptee(): void
    {
        $booking = $this->makeBooking(BookingStatus::Accepted->value);

        $this->actingAs($this->aeshUser)
            ->postJson("/api/bookings/{$booking->id}/cancel", ['reason' => 'Empêchement de dernière minute.'])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_une_demande_refusee_ne_peut_plus_etre_acceptee(): void
    {
        $booking = $this->makeBooking(BookingStatus::Declined->value);

        $this->actingAs($this->aeshUser)
            ->postJson("/api/bookings/{$booking->id}/accept")
            ->assertStatus(422);

        $this->assertSame(BookingStatus::Declined, $booking->refresh()->status);
    }

    public function test_une_demande_annulee_ne_peut_plus_etre_acceptee(): void
    {
        $booking = $this->makeBooking(BookingStatus::Cancelled->value);

        $this->actingAs($this->aeshUser)
            ->postJson("/api/bookings/{$booking->id}/accept")
            ->assertStatus(422);
    }

    public function test_une_demande_acceptee_ne_peut_plus_etre_refusee(): void
    {
        $booking = $this->makeBooking(BookingStatus::Accepted->value);

        $this->actingAs($this->aeshUser)
            ->postJson("/api/bookings/{$booking->id}/decline", ['reason' => 'Changement de planning.'])
            ->assertStatus(422);
    }

    // ── Permissions ───────────────────────────────────────────────────────────

    public function test_un_autre_aesh_ne_peut_pas_repondre(): void
    {
        $booking = $this->makeBooking();
        $intruder = User::factory()->create(['role' => 'aesh']);
        $this->makeProfile($intruder, AeshProfile::STATUS_PUBLISHED);

        $this->actingAs($intruder)
            ->postJson("/api/bookings/{$booking->id}/accept")
            ->assertStatus(403);
    }

    public function test_un_autre_parent_ne_voit_pas_la_demande(): void
    {
        $booking = $this->makeBooking();
        $intruder = User::factory()->create(['role' => 'parent']);

        $this->actingAs($intruder)
            ->getJson("/api/bookings/{$booking->id}")
            ->assertStatus(403);
    }

    public function test_le_parent_ne_peut_pas_accepter_sa_propre_demande(): void
    {
        $booking = $this->makeBooking();

        $this->actingAs($this->parent)
            ->postJson("/api/bookings/{$booking->id}/accept")
            ->assertStatus(403);
    }

    // ── Listes ────────────────────────────────────────────────────────────────

    public function test_le_parent_ne_liste_que_ses_demandes(): void
    {
        $this->makeBooking();

        $otherParent = User::factory()->create(['role' => 'parent']);
        BookingRequest::create([
            'parent_id'       => $otherParent->id,
            'aesh_profile_id' => $this->profile->id,
            'message'         => 'Demande d’un autre parent pour son enfant.',
            'modality_id'     => Modality::first()->id,
            'school_level_id' => SchoolLevel::first()->id,
            'start_date'      => now()->addWeek()->toDateString(),
            'hours_per_week'  => 3,
            'hourly_rate'     => 35,
        ]);

        $this->actingAs($this->parent)
            ->getJson('/api/bookings')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_l_aesh_liste_les_demandes_recues(): void
    {
        $this->makeBooking();

        $this->actingAs($this->aeshUser)
            ->getJson('/api/bookings')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.parent.name', $this->parent->name);
    }

    public function test_filtre_par_statut(): void
    {
        $this->makeBooking();
        $this->makeBooking(BookingStatus::Accepted->value);

        $this->actingAs($this->parent)
            ->getJson('/api/bookings?status=accepted')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'accepted');
    }

    public function test_filtre_par_statut_invalide_refuse(): void
    {
        $this->actingAs($this->parent)
            ->getJson('/api/bookings?status=inconnu')
            ->assertStatus(422);
    }

    public function test_le_detail_expose_l_historique(): void
    {
        $booking = $this->makeBooking();
        $this->actingAs($this->aeshUser)->postJson("/api/bookings/{$booking->id}/accept")->assertOk();

        $this->actingAs($this->parent)
            ->getJson("/api/bookings/{$booking->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.histories')
            ->assertJsonPath('data.histories.0.to_status', 'accepted');
    }
}
