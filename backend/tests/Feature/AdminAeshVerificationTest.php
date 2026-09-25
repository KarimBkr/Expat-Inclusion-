<?php

namespace Tests\Feature;

use App\Models\AeshProfile;
use App\Models\User;
use App\Notifications\InterviewInvitationNotification;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AdminAeshVerificationTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private AeshProfile $profile;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        $this->admin = User::where('role', 'admin')->first();

        $aesh = User::factory()->create(['role' => 'aesh', 'name' => 'Samira AESH']);
        $this->profile = AeshProfile::create([
            'user_id'             => $aesh->id,
            'verification_status' => AeshProfile::STATUS_PENDING,
            'bio'                 => 'AESH expatriée, 10 ans d\'expérience.',
        ]);
    }

    public function test_admin_peut_lister_les_profils_en_attente(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/admin/aesh-profiles?status=pending')
            ->assertOk()
            ->assertJsonPath('data.0.verification_status', 'pending');
    }

    public function test_admin_peut_approuver_un_profil(): void
    {
        $this->actingAs($this->admin)
            ->postJson("/api/admin/aesh-profiles/{$this->profile->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.verification_status', 'approved');
    }

    public function test_admin_peut_rejeter_un_profil(): void
    {
        $this->actingAs($this->admin)
            ->postJson("/api/admin/aesh-profiles/{$this->profile->id}/reject", [
                'rejection_reason' => 'Documents incomplets.',
            ])
            ->assertOk()
            ->assertJsonPath('data.verification_status', 'rejected');
    }

    public function test_admin_peut_publier_un_profil_approuve(): void
    {
        $this->profile->update(['verification_status' => AeshProfile::STATUS_APPROVED]);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/aesh-profiles/{$this->profile->id}/publish")
            ->assertOk()
            ->assertJsonPath('data.verification_status', 'published');
    }

    public function test_admin_peut_ajouter_une_note_interne(): void
    {
        $this->actingAs($this->admin)
            ->postJson("/api/admin/aesh-profiles/{$this->profile->id}/notes", [
                'body' => 'Vérifier le diplôme lors du prochain échange.',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.body', 'Vérifier le diplôme lors du prochain échange.');
    }

    public function test_parent_ne_peut_pas_verifier_les_profils_aesh(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);

        $this->actingAs($parent)
            ->getJson('/api/admin/aesh-profiles')
            ->assertStatus(403);
    }

    public function test_publication_echoue_si_profil_non_approuve(): void
    {
        $this->actingAs($this->admin)
            ->postJson("/api/admin/aesh-profiles/{$this->profile->id}/publish")
            ->assertStatus(422);
    }

    /**
     * La vérification par entretien est orthogonale au statut de candidature :
     * accordable même sur un profil encore `pending`, sans dépendre d'une
     * approbation ou d'une publication préalable.
     */
    public function test_admin_peut_accorder_la_verification_par_entretien(): void
    {
        $this->actingAs($this->admin)
            ->postJson("/api/admin/aesh-profiles/{$this->profile->id}/interview-verify")
            ->assertOk()
            ->assertJsonPath('data.verification_status', 'pending')
            ->assertJsonPath('data.interview_verified_at', fn ($value) => $value !== null);

        $this->assertNotNull($this->profile->fresh()->interview_verified_at);
    }

    public function test_admin_peut_retirer_la_verification_par_entretien(): void
    {
        $this->profile->update(['interview_verified_at' => now()]);

        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/aesh-profiles/{$this->profile->id}/interview-verify")
            ->assertOk()
            ->assertJsonPath('data.interview_verified_at', null);

        $this->assertNull($this->profile->fresh()->interview_verified_at);
    }

    public function test_parent_ne_peut_pas_accorder_la_verification_par_entretien(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);

        $this->actingAs($parent)
            ->postJson("/api/admin/aesh-profiles/{$this->profile->id}/interview-verify")
            ->assertStatus(403);
    }

    public function test_admin_envoie_une_invitation_a_entretien(): void
    {
        Notification::fake();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/aesh-profiles/{$this->profile->id}/interview-invitation", [
                'meeting_link' => 'https://teams.microsoft.com/l/meetup-join/abc123',
                'message'      => 'Merci de préparer un exemple concret d’accompagnement TSA.',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.body', fn ($body) => str_contains($body, 'teams.microsoft.com'));

        Notification::assertSentTo(
            $this->profile->user,
            InterviewInvitationNotification::class,
        );
    }

    public function test_invitation_echoue_sans_lien_valide(): void
    {
        Notification::fake();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/aesh-profiles/{$this->profile->id}/interview-invitation", [
                'meeting_link' => 'pas-une-url',
            ])
            ->assertStatus(422);

        Notification::assertNothingSent();
    }

    public function test_invitation_laisse_une_trace_dans_les_notes_internes(): void
    {
        Notification::fake();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/aesh-profiles/{$this->profile->id}/interview-invitation", [
                'meeting_link' => 'https://meet.google.com/abc-defg-hij',
            ]);

        $this->actingAs($this->admin)
            ->getJson("/api/admin/aesh-profiles/{$this->profile->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.admin_notes');
    }

    public function test_parent_ne_peut_pas_envoyer_d_invitation_a_entretien(): void
    {
        Notification::fake();
        $parent = User::factory()->create(['role' => 'parent']);

        $this->actingAs($parent)
            ->postJson("/api/admin/aesh-profiles/{$this->profile->id}/interview-invitation", [
                'meeting_link' => 'https://meet.google.com/abc-defg-hij',
            ])
            ->assertStatus(403);

        Notification::assertNothingSent();
    }
}
