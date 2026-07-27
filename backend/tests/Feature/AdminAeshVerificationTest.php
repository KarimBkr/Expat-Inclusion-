<?php

namespace Tests\Feature;

use App\Models\AeshProfile;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
