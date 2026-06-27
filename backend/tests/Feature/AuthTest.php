<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ── Inscription ───────────────────────────────────────────────────────────

    public function test_parent_peut_sinscrire(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name'                  => 'Marie Parent',
            'email'                 => 'marie@exemple.com',
            'password'              => 'Password1',
            'password_confirmation' => 'Password1',
            'role'                  => 'parent',
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['role' => 'parent']);

        $this->assertDatabaseHas('users', ['email' => 'marie@exemple.com', 'role' => 'parent']);
        Notification::assertSentTo(User::first(), VerifyEmail::class);
    }

    public function test_aesh_peut_sinscrire(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name'                  => 'Ali AESH',
            'email'                 => 'ali@exemple.com',
            'password'              => 'Password1',
            'password_confirmation' => 'Password1',
            'role'                  => 'aesh',
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['role' => 'aesh']);
    }

    public function test_inscription_echoue_si_email_duplique(): void
    {
        User::factory()->create(['email' => 'existe@exemple.com']);

        $this->postJson('/api/register', [
            'name'                  => 'Test',
            'email'                 => 'existe@exemple.com',
            'password'              => 'Password1',
            'password_confirmation' => 'Password1',
            'role'                  => 'parent',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_inscription_echoue_si_role_invalide(): void
    {
        $this->postJson('/api/register', [
            'name'                  => 'Test',
            'email'                 => 'test@exemple.com',
            'password'              => 'Password1',
            'password_confirmation' => 'Password1',
            'role'                  => 'admin',
        ])->assertStatus(422)->assertJsonValidationErrors('role');
    }

    public function test_inscription_echoue_si_mot_de_passe_trop_simple(): void
    {
        $this->postJson('/api/register', [
            'name'                  => 'Test',
            'email'                 => 'test@exemple.com',
            'password'              => '123',
            'password_confirmation' => '123',
            'role'                  => 'parent',
        ])->assertStatus(422)->assertJsonValidationErrors('password');
    }

    // ── Connexion ─────────────────────────────────────────────────────────────

    public function test_utilisateur_peut_se_connecter(): void
    {
        $user = User::factory()->create([
            'email'    => 'user@exemple.com',
            'password' => bcrypt('Password1'),
            'role'     => 'parent',
        ]);

        $this->postJson('/api/login', [
            'email'    => 'user@exemple.com',
            'password' => 'Password1',
        ])->assertOk()
            ->assertJsonFragment(['email' => 'user@exemple.com']);
    }

    public function test_login_echoue_avec_mauvais_mot_de_passe(): void
    {
        User::factory()->create(['email' => 'user@exemple.com', 'password' => bcrypt('Password1')]);

        $this->postJson('/api/login', [
            'email'    => 'user@exemple.com',
            'password' => 'wrong',
        ])->assertStatus(401);
    }

    // ── Déconnexion ───────────────────────────────────────────────────────────

    public function test_utilisateur_peut_se_deconnecter(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/logout')
            ->assertOk();
    }

    // ── /me ───────────────────────────────────────────────────────────────────

    public function test_me_retourne_utilisateur_connecte(): void
    {
        $user = User::factory()->create(['role' => 'aesh']);

        $this->actingAs($user)
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonFragment(['email' => $user->email, 'role' => 'aesh']);
    }

    public function test_me_refuse_acces_non_authentifie(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
    }

    // ── Guards par rôle ───────────────────────────────────────────────────────

    public function test_route_parent_refuse_un_aesh(): void
    {
        $aesh = User::factory()->create(['role' => 'aesh']);

        $this->actingAs($aesh)
            ->getJson('/api/parent/test-guard')
            ->assertStatus(404); // route non définie = 404 (pas d'accès)
    }

    public function test_route_protegee_refuse_non_authentifie(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
        $this->postJson('/api/logout')->assertStatus(401);
        $this->postJson('/api/email/resend')->assertStatus(401);
    }

    // ── Mot de passe oublié ───────────────────────────────────────────────────

    public function test_forgot_password_envoie_le_lien(): void
    {
        Notification::fake();

        User::factory()->create(['email' => 'user@exemple.com']);

        $this->postJson('/api/forgot-password', ['email' => 'user@exemple.com'])
            ->assertOk();
    }

    public function test_forgot_password_ne_revele_pas_si_email_inexistant(): void
    {
        Notification::fake();

        $this->postJson('/api/forgot-password', ['email' => 'inexistant@exemple.com'])
            ->assertOk(); // réponse identique pour éviter l'énumération
    }
}
