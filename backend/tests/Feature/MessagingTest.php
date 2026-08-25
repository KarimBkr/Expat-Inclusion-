<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Models\AeshProfile;
use App\Models\BookingRequest;
use App\Models\Modality;
use App\Models\SchoolLevel;
use App\Models\User;
use App\Services\BookingRequestService;
use App\Services\ConversationProvisioner;
use Database\Seeders\CountrySeeder;
use Database\Seeders\LanguageSeeder;
use Database\Seeders\ModalitySeeder;
use Database\Seeders\SchoolLevelSeeder;
use Database\Seeders\SpecializationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Lcobucci\JWT\UnencryptedToken;
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
            'user_id' => $this->aeshUser->id,
            'bio' => 'Accompagnante spécialisée pour le test messagerie.',
            'timezone' => 'Europe/Paris',
            'verification_status' => AeshProfile::STATUS_PUBLISHED,
            'published_at' => now(),
        ]);

        $fakeToken = Mockery::mock(UnencryptedToken::class);
        $fakeToken->shouldReceive('toString')->andReturn('fake-firebase-custom-token');

        $auth = Mockery::mock(FirebaseAuth::class);
        $auth->shouldReceive('createCustomToken')->andReturn($fakeToken);
        $this->app->instance(FirebaseAuth::class, $auth);

        // Le provisionnement Firestore réel est couvert par
        // ConversationProvisionerTest ; ici on vérifie le câblage
        // policy/controller, pas l'écriture Firestore elle-même.
        $this->mock(ConversationProvisioner::class, function ($mock) {
            $mock->shouldReceive('ensure')->byDefault();
        });
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
            'responded_at' => $status === BookingStatus::Requested->value ? null : now(),
        ]);
    }

    /** Simule le cycle réel demandé → accepté [→ annulé] pour peupler l'historique. */
    private function makeBookingThroughHistory(bool $cancelAfterAccepting = false): BookingRequest
    {
        $booking = $this->makeBooking(BookingStatus::Requested->value);

        app(BookingRequestService::class)->transition(
            $booking,
            BookingStatus::Accepted,
            $this->aeshUser,
        );

        if ($cancelAfterAccepting) {
            app(BookingRequestService::class)->transition(
                $booking->refresh(),
                BookingStatus::Cancelled,
                $this->parent,
                'Changement de programme.',
            );
        }

        return $booking->refresh();
    }

    public function test_utilisateur_peut_obtenir_un_token_firebase(): void
    {
        $this->actingAs($this->parent)
            ->postJson('/api/firebase/token')
            ->assertOk()
            ->assertExactJsonStructure(['token', 'uid']);
    }

    /**
     * Régression : le token ne doit plus jamais grossir avec le nombre de
     * demandes acceptées — c'est ce qui dépassait la limite Firebase de 1000
     * octets de claims vers 70 demandes. La liste des conversations
     * autorisées n'est plus transportée dans le token du tout.
     */
    public function test_le_token_ne_transporte_plus_la_liste_des_conversations(): void
    {
        $this->makeBookingThroughHistory();
        $this->makeBookingThroughHistory();
        $this->makeBookingThroughHistory(cancelAfterAccepting: true);

        $this->actingAs($this->parent)
            ->postJson('/api/firebase/token')
            ->assertOk()
            ->assertJsonMissing(['allowed_conversations']);
    }

    public function test_token_refuse_non_authentifie(): void
    {
        $this->postJson('/api/firebase/token')->assertStatus(401);
    }

    public function test_parent_voit_la_conversation_dune_demande_acceptee(): void
    {
        $booking = $this->makeBookingThroughHistory();

        $this->actingAs($this->parent)
            ->getJson("/api/bookings/{$booking->id}/conversation")
            ->assertOk()
            ->assertJsonPath('data.conversation_id', 'booking_'.$booking->id)
            ->assertJsonPath('data.peer.name', $this->aeshUser->name)
            ->assertJsonPath('data.aesh_user_id', (string) $this->aeshUser->id);
    }

    public function test_show_provisionne_le_document_firestore(): void
    {
        $booking = $this->makeBookingThroughHistory();

        $this->mock(ConversationProvisioner::class, function ($mock) use ($booking) {
            $mock->shouldReceive('ensure')
                ->once()
                ->with(Mockery::on(fn (BookingRequest $b) => $b->id === $booking->id));
        });

        $this->actingAs($this->parent)
            ->getJson("/api/bookings/{$booking->id}/conversation")
            ->assertOk();
    }

    /**
     * Trou de sécurité corrigé : annuler une demande jamais acceptée ne doit
     * pas permettre d'obtenir un accès à une conversation qui n'a jamais
     * existé. Avant correction, le filtre sur le statut courant ne
     * distinguait pas ce cas d'une annulation survenue après acceptation.
     */
    public function test_conversation_refusee_si_jamais_acceptee(): void
    {
        $booking = $this->makeBooking(BookingStatus::Requested->value);

        $this->mock(ConversationProvisioner::class, function ($mock) {
            $mock->shouldNotReceive('ensure');
        });

        $this->actingAs($this->parent)
            ->getJson("/api/bookings/{$booking->id}/conversation")
            ->assertStatus(403);
    }

    public function test_conversation_refusee_si_annulee_avant_toute_acceptation(): void
    {
        $booking = $this->makeBooking(BookingStatus::Requested->value);
        app(BookingRequestService::class)->transition(
            $booking,
            BookingStatus::Cancelled,
            $this->parent,
            'Finalement plus besoin.',
        );

        $this->actingAs($this->parent)
            ->getJson("/api/bookings/{$booking->refresh()->id}/conversation")
            ->assertStatus(403);
    }

    /**
     * Régression : une conversation reste accessible après annulation d'une
     * demande qui a été acceptée — l'historique des échanges ne doit pas
     * disparaître avec le statut de la réservation.
     */
    public function test_conversation_reste_accessible_apres_annulation_dune_demande_acceptee(): void
    {
        $booking = $this->makeBookingThroughHistory(cancelAfterAccepting: true);

        $this->actingAs($this->parent)
            ->getJson("/api/bookings/{$booking->id}/conversation")
            ->assertOk()
            ->assertJsonPath('data.conversation_id', 'booking_'.$booking->id);

        $this->actingAs($this->aeshUser)
            ->getJson("/api/bookings/{$booking->id}/conversation")
            ->assertOk();
    }

    public function test_tiers_ne_peut_pas_acceder_a_la_conversation(): void
    {
        $booking = $this->makeBookingThroughHistory();
        $intrus = User::factory()->create(['role' => 'parent']);

        $this->actingAs($intrus)
            ->getJson("/api/bookings/{$booking->id}/conversation")
            ->assertStatus(403);
    }

    public function test_inbox_liste_uniquement_les_demandes_ayant_ete_acceptees(): void
    {
        $accepted = $this->makeBookingThroughHistory();
        BookingRequest::create([
            'parent_id' => $this->parent->id,
            'aesh_profile_id' => $this->profile->id,
            'status' => BookingStatus::Requested,
            'message' => 'Autre demande.',
            'modality_id' => Modality::first()->id,
            'school_level_id' => SchoolLevel::first()->id,
            'start_date' => now()->addWeeks(2)->toDateString(),
            'hours_per_week' => 4,
        ]);

        $this->actingAs($this->parent)
            ->getJson('/api/conversations')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.booking_id', $accepted->id);
    }

    /**
     * Régression : l'inbox doit conserver une conversation dont la demande a
     * été annulée après acceptation — avant correction, le filtre sur le
     * statut courant la faisait disparaître de la liste au lieu de la garder
     * comme historique consultable.
     */
    public function test_inbox_conserve_les_demandes_annulees_apres_acceptation(): void
    {
        $cancelled = $this->makeBookingThroughHistory(cancelAfterAccepting: true);

        $this->actingAs($this->parent)
            ->getJson('/api/conversations')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.booking_id', $cancelled->id)
            ->assertJsonPath('data.0.status', 'cancelled');
    }

    public function test_aesh_voit_aussi_son_inbox(): void
    {
        $this->makeBookingThroughHistory();

        $this->actingAs($this->aeshUser)
            ->getJson('/api/conversations')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.peer.name', $this->parent->name);
    }
}
