<?php

namespace Tests\Feature;

use App\Models\Country;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTaxonomyTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $parent;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        $this->admin = User::where('role', 'admin')->first();
        $this->parent = User::factory()->create(['role' => 'parent']);
    }

    public function test_admin_peut_lister_les_pays(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/admin/taxonomies/countries')
            ->assertOk()
            ->assertJsonStructure(['data' => [['id', 'code', 'name', 'is_aefe_network']]]);
    }

    public function test_admin_peut_creer_une_specialisation(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/admin/taxonomies/specializations', [
                'slug' => 'test-besoin',
                'name' => 'Besoin test',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.slug', 'test-besoin');

        $this->assertDatabaseHas('specializations', ['slug' => 'test-besoin']);
    }

    public function test_admin_peut_mettre_a_jour_un_pays(): void
    {
        $country = Country::first();

        $this->actingAs($this->admin)
            ->putJson("/api/admin/taxonomies/countries/{$country->id}", [
                'code'            => $country->code,
                'name'            => 'France métropolitaine',
                'is_aefe_network' => true,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'France métropolitaine');
    }

    public function test_admin_peut_supprimer_une_modalite(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/admin/taxonomies/modalities', [
                'slug' => 'a-supprimer',
                'name' => 'À supprimer',
            ])
            ->assertStatus(201);

        $id = \App\Models\Modality::where('slug', 'a-supprimer')->value('id');

        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/taxonomies/modalities/{$id}")
            ->assertOk();

        $this->assertDatabaseMissing('modalities', ['slug' => 'a-supprimer']);
    }

    public function test_parent_ne_peut_pas_acceder_au_crud_admin(): void
    {
        $this->actingAs($this->parent)
            ->getJson('/api/admin/taxonomies/countries')
            ->assertStatus(403);

        $this->actingAs($this->parent)
            ->postJson('/api/admin/taxonomies/languages', [
                'code' => 'xx',
                'name' => 'Test',
            ])
            ->assertStatus(403);
    }

    public function test_type_taxonomie_invalide_retourne_404(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/admin/taxonomies/inconnu')
            ->assertStatus(404);
    }

    public function test_creation_echoue_si_slug_duplique(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/admin/taxonomies/specializations', [
                'slug' => 'tsa',
                'name' => 'Doublon',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('slug');
    }
}
