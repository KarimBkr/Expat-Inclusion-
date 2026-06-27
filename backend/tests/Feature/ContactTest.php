<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use App\Jobs\SendContactEmail;
use Tests\TestCase;

class ContactTest extends TestCase
{
    use RefreshDatabase;

    private array $validPayload = [
        'name'    => 'Jean Dupont',
        'email'   => 'jean@exemple.com',
        'role'    => 'parent',
        'subject' => 'Recherche un AESH à Dubaï',
        'message' => 'Bonjour, je recherche un accompagnant pour mon enfant TSA à Dubaï. Merci.',
    ];

    public function test_contact_soumis_avec_donnees_valides_retourne_201(): void
    {
        Queue::fake();

        $response = $this->postJson('/api/contact', $this->validPayload);

        $response->assertStatus(201)
            ->assertJson(['message' => 'Message envoyé avec succès.']);

        Queue::assertPushed(SendContactEmail::class);
    }

    public function test_contact_sans_nom_retourne_422(): void
    {
        $payload = array_merge($this->validPayload, ['name' => '']);

        $this->postJson('/api/contact', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_contact_email_invalide_retourne_422(): void
    {
        $payload = array_merge($this->validPayload, ['email' => 'pas-un-email']);

        $this->postJson('/api/contact', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_contact_role_invalide_retourne_422(): void
    {
        $payload = array_merge($this->validPayload, ['role' => 'inconnu']);

        $this->postJson('/api/contact', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['role']);
    }

    public function test_contact_message_trop_court_retourne_422(): void
    {
        $payload = array_merge($this->validPayload, ['message' => 'Trop court.']);

        $this->postJson('/api/contact', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    }

    public function test_contact_champs_vides_retourne_422_avec_toutes_les_erreurs(): void
    {
        $this->postJson('/api/contact', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'role', 'subject', 'message']);
    }
}
