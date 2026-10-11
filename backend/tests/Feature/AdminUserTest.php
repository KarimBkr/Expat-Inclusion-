<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_admin_peut_lister_les_utilisateurs(): void
    {
        User::factory()->create(['role' => 'parent']);
        User::factory()->create(['role' => 'aesh']);

        $this->actingAs($this->admin)
            ->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_admin_peut_filtrer_par_role(): void
    {
        User::factory()->create(['role' => 'parent']);
        User::factory()->create(['role' => 'aesh']);

        $this->actingAs($this->admin)
            ->getJson('/api/admin/users?role=parent')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.role', 'parent');
    }

    public function test_admin_peut_suspendre_un_parent(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/users/{$parent->id}/suspend")
            ->assertOk()
            ->assertJsonPath('data.suspended_at', fn ($value) => $value !== null);

        $this->assertNotNull($parent->fresh()->suspended_at);
    }

    public function test_un_compte_suspendu_ne_peut_plus_se_connecter(): void
    {
        $parent = User::factory()->create(['role' => 'parent', 'password' => bcrypt('motdepasse')]);
        $parent->update(['suspended_at' => now()]);

        $this->postJson('/api/login', [
            'email'    => $parent->email,
            'password' => 'motdepasse',
        ])->assertStatus(403);
    }

    public function test_admin_peut_reactiver_un_compte_suspendu(): void
    {
        $parent = User::factory()->create(['role' => 'parent', 'suspended_at' => now()]);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/users/{$parent->id}/reactivate")
            ->assertOk()
            ->assertJsonPath('data.suspended_at', null);

        $this->assertNull($parent->fresh()->suspended_at);
    }

    public function test_impossible_de_suspendre_un_administrateur(): void
    {
        $autreAdmin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/users/{$autreAdmin->id}/suspend")
            ->assertStatus(422);

        $this->assertNull($autreAdmin->fresh()->suspended_at);
    }

    public function test_parent_ne_peut_pas_acceder_au_cockpit_utilisateurs(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);

        $this->actingAs($parent)
            ->getJson('/api/admin/users')
            ->assertStatus(403);
    }
}
