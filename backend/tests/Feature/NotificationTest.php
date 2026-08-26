<?php

namespace Tests\Feature;

use App\Models\User;
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
}
