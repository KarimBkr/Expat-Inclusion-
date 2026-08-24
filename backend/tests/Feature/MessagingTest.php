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
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Mockery;
use Tests\TestCase;

class MessagingTest extends TestCase
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
            'user_id'             => $this->aeshUser->id,
            'bio'                 => 'Accompagnante spécialisée pour le test messagerie.',
            'hourly_rate'         => 35,
            'timezone'            => 'Europe/Paris',
            'verification_status' => AeshProfile::STATUS_PUBLISHED,
            'published_at'        => now(),
        ]);

        $fakeToken = Mockery::mock(\Lcobucci\JWT\UnencryptedToken::class);
        $fakeToken->shouldReceive('toString')->andReturn('fake-firebase-custom-token');

        $auth = Mockery::mock(FirebaseAuth::class);
        $auth->shouldReceive('createCustomToken')->andReturn($fakeToken);
        $this->app->instance(FirebaseAuth::class, $auth);
    }

    private function makeAcceptedBooking(): BookingRequest
    {
        return BookingRequest::create([
            'parent_id'       => $this->parent->id,
            'aesh_profile_id' => $this->profile->id,
            'status'          => BookingStatus::Accepted,
            'message'         => 'Nous cherchons un accompagnement.',
            'modality_id'     => Modality::first()->id,
            'school_level_id' => SchoolLevel::first()->id,
            'start_date'      => now()->addWeek()->toDateString(),
            'hours_per_week'  => 6,
            'hourly_rate'     => 35,
            'responded_at'    => now(),
        ]);
    }

    public function test_utilisateur_peut_obtenir_un_token_firebase(): void
    {
        $this->actingAs($this->parent)
            ->postJson('/api/firebase/token')
            ->assertOk()
            ->assertJsonStructure(['token', 'uid', 'allowed_conversations']);
    }

    public function test_token_inclut_les_conversations_des_demandes_acceptees(): void
    {
        $booking = $this->makeAcceptedBooking();

        $this->actingAs($this->parent)
            ->postJson('/api/firebase/token')
            ->assertOk()
            ->assertJsonPath('uid', (string) $this->parent->id)
            ->assertJsonPath('allowed_conversations.0', 'booking_'.$booking->id);
    }

    public function test_token_refuse_non_authentifie(): void
    {
        $this->postJson('/api/firebase/token')->assertStatus(401);
    }

    public function test_parent_voit_la_conversation_dune_demande_acceptee(): void
    {
        $booking = $this->makeAcceptedBooking();

        $this->actingAs($this->parent)
            ->getJson("/api/bookings/{$booking->id}/conversation")
            ->assertOk()
            ->assertJsonPath('data.conversation_id', 'booking_'.$booking->id)
            ->assertJsonPath('data.peer.name', $this->aeshUser->name)
            ->assertJsonPath('data.aesh_user_id', (string) $this->aeshUser->id);
    }

    public function test_conversation_refusee_si_demande_non_acceptee(): void
    {
        $booking = $this->makeAcceptedBooking();
        $booking->update(['status' => BookingStatus::Requested]);

        $this->actingAs($this->parent)
            ->getJson("/api/bookings/{$booking->id}/conversation")
            ->assertStatus(422);
    }

    public function test_tiers_ne_peut_pas_acceder_a_la_conversation(): void
    {
        $booking = $this->makeAcceptedBooking();
        $intrus = User::factory()->create(['role' => 'parent']);

        $this->actingAs($intrus)
            ->getJson("/api/bookings/{$booking->id}/conversation")
            ->assertStatus(403);
    }

    public function test_inbox_liste_uniquement_les_demandes_acceptees(): void
    {
        $accepted = $this->makeAcceptedBooking();
        BookingRequest::create([
            'parent_id'       => $this->parent->id,
            'aesh_profile_id' => $this->profile->id,
            'status'          => BookingStatus::Requested,
            'message'         => 'Autre demande.',
            'modality_id'     => Modality::first()->id,
            'school_level_id' => SchoolLevel::first()->id,
            'start_date'      => now()->addWeeks(2)->toDateString(),
            'hours_per_week'  => 4,
            'hourly_rate'     => 35,
        ]);

        $this->actingAs($this->parent)
            ->getJson('/api/conversations')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.booking_id', $accepted->id);
    }

    public function test_aesh_voit_aussi_son_inbox(): void
    {
        $this->makeAcceptedBooking();

        $this->actingAs($this->aeshUser)
            ->getJson('/api/conversations')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.peer.name', $this->parent->name);
    }
}
