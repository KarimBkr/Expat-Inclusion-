<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Mail\AeshProfileReviewedMail;
use App\Mail\BookingRequestAcceptedMail;
use App\Mail\BookingRequestCancelledMail;
use App\Mail\BookingRequestDeclinedMail;
use App\Mail\BookingRequestReceivedMail;
use App\Mail\ContactReceived;
use App\Models\AeshProfile;
use App\Models\BookingRequest;
use App\Models\Modality;
use App\Models\SchoolLevel;
use App\Models\User;
use App\Notifications\AeshProfileReviewedNotification;
use Database\Seeders\ModalitySeeder;
use Database\Seeders\SchoolLevelSeeder;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['role' => 'parent']);
    }

    /**
     * Écrit directement une ligne `notifications` — le contenu généré par
     * chaque type de notification (mail + payload `data`) est déjà couvert
     * par les tests de `BookingRequestTest`. Ici, seul le CRUD (liste,
     * lecture, isolation par utilisateur) est testé.
     */
    private function notify(User $user): void
    {
        DatabaseNotification::create([
            'id' => (string) Str::uuid(),
            'type' => 'App\\Notifications\\BookingRequestReceivedNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'data' => ['type' => 'booking_request_received', 'message' => 'Nouvelle demande.'],
        ]);
    }

    public function test_liste_les_notifications_de_lutilisateur_courant(): void
    {
        $this->notify($this->user);

        $this->actingAs($this->user)
            ->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonPath('unread_count', 1)
            ->assertJsonCount(1, 'data.data');
    }

    public function test_ne_liste_pas_les_notifications_dun_autre_utilisateur(): void
    {
        $other = User::factory()->create(['role' => 'parent']);
        $this->notify($other);

        $this->actingAs($this->user)
            ->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonPath('unread_count', 0)
            ->assertJsonCount(0, 'data.data');
    }

    public function test_marque_une_notification_comme_lue(): void
    {
        $this->notify($this->user);
        $id = $this->user->notifications()->first()->id;

        $this->actingAs($this->user)
            ->postJson("/api/notifications/{$id}/read")
            ->assertOk();

        $this->assertNotNull($this->user->notifications()->first()->read_at);
    }

    public function test_ne_peut_pas_marquer_comme_lue_la_notification_dun_autre(): void
    {
        $other = User::factory()->create(['role' => 'parent']);
        $this->notify($other);
        $id = $other->notifications()->first()->id;

        $this->actingAs($this->user)
            ->postJson("/api/notifications/{$id}/read")
            ->assertStatus(404);

        $this->assertNull($other->notifications()->first()->read_at);
    }

    public function test_marque_toutes_les_notifications_comme_lues(): void
    {
        $this->notify($this->user);
        $this->notify($this->user);

        $this->actingAs($this->user)
            ->postJson('/api/notifications/read-all')
            ->assertOk();

        $this->assertSame(0, $this->user->unreadNotifications()->count());
    }

    public function test_visiteur_non_authentifie_refuse(): void
    {
        $this->getJson('/api/notifications')->assertStatus(401);
    }

    // ── Emails transactionnels (US-16) ────────────────────────────────────────

    private function aeshProfile(string $status, ?string $reason = null): AeshProfile
    {
        return AeshProfile::create([
            'user_id'             => User::factory()->create(['role' => 'aesh', 'name' => 'Sarah Martin'])->id,
            'bio'                 => 'Accompagnante spécialisée.',
            'timezone'            => 'Europe/Paris',
            'verification_status' => $status,
            'rejection_reason'    => $reason,
        ]);
    }

    /** Sujet clair, un seul CTA, pied RGPD, aucun texte de paiement quand les frais sont désactivés. */
    private function assertEmailConforme(Mailable $mail, string $subject, string $ctaPath, array $absents = []): void
    {
        $html = $mail->render();

        $this->assertSame("[Expat Inclusion] {$subject}", $mail->envelope()->subject);
        $this->assertSame(1, substr_count($html, 'border-radius:10px;">'), "un seul CTA : {$subject}");
        $this->assertStringContainsString($ctaPath, $html);
        $this->assertStringContainsString('RGPD', $html);
        $this->assertDoesNotMatchRegularExpression('/paiement|payer|payé|stripe|tarif|€/i', $html);
        $this->assertStringNotContainsString('profil vérifié', $html);
        foreach ($absents as $absent) {
            $this->assertStringNotContainsString($absent, $html);
        }
    }

    public function test_chaque_email_transactionnel_est_conforme_frais_desactives(): void
    {
        config(['services.stripe.platform_fee_enabled' => false, 'app.frontend_url' => 'http://front.test']);
        $this->seed([ModalitySeeder::class, SchoolLevelSeeder::class]);

        $booking = BookingRequest::create([
            'parent_id'       => $this->user->id,
            'aesh_profile_id' => $this->aeshProfile(AeshProfile::STATUS_PUBLISHED)->id,
            'status'          => BookingStatus::Requested->value,
            'message'         => 'Notre fils a un trouble du spectre autistique.',
            'modality_id'     => Modality::first()->id,
            'school_level_id' => SchoolLevel::first()->id,
            'start_date'      => now()->addWeek()->toDateString(),
            'hours_per_week'  => 6,
        ]);
        $medical = ['trouble du spectre autistique'];

        $this->assertEmailConforme(new BookingRequestReceivedMail($booking), 'Nouvelle demande de réservation', 'http://front.test/dashboard/aesh/demandes', $medical);
        $this->assertEmailConforme(new BookingRequestAcceptedMail($booking), 'Votre demande a été acceptée', "http://front.test/dashboard/parent/conversations/{$booking->id}", $medical);
        $this->assertEmailConforme(new BookingRequestDeclinedMail($booking, 'Plus de disponibilité.'), 'Votre demande a été refusée', 'http://front.test/dashboard/parent/recherche', $medical);
        $this->assertEmailConforme(new BookingRequestCancelledMail($booking, $this->user, null), 'Une réservation a été annulée', 'http://front.test/dashboard/parent/reservations', $medical);
        $this->assertEmailConforme(new AeshProfileReviewedMail($this->aeshProfile(AeshProfile::STATUS_APPROVED)), 'Votre candidature a été examinée par notre équipe', 'http://front.test/dashboard/aesh"');
        $this->assertEmailConforme(new AeshProfileReviewedMail($this->aeshProfile(AeshProfile::STATUS_REJECTED, 'Merci d’ajouter votre CV.')), 'Votre candidature nécessite des compléments', 'http://front.test/dashboard/aesh/documents');
        $this->assertEmailConforme(new ContactReceived([
            'name' => 'Marie', 'email' => 'marie@exemple.com', 'role' => 'parent', 'subject' => 'Question', 'message' => 'Bonjour',
        ]), 'Question', 'mailto:marie@exemple.com');
    }

    public function test_approbation_et_rejet_previennent_laesh(): void
    {
        Notification::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $approved = $this->aeshProfile(AeshProfile::STATUS_PENDING);
        $rejected = $this->aeshProfile(AeshProfile::STATUS_PENDING);

        $this->actingAs($admin)->postJson("/api/admin/aesh-profiles/{$approved->id}/approve")->assertOk();
        $this->actingAs($admin)->postJson("/api/admin/aesh-profiles/{$rejected->id}/reject", ['rejection_reason' => 'Merci d’ajouter votre CV.'])->assertOk();

        Notification::assertSentTo($approved->user, AeshProfileReviewedNotification::class);
        Notification::assertSentTo($rejected->user, AeshProfileReviewedNotification::class);
        Notification::assertCount(2);
    }
}
