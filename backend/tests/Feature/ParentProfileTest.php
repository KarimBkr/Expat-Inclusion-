<?php

namespace Tests\Feature;

use App\Models\Country;
use App\Models\ParentProfile;
use App\Models\SchoolLevel;
use App\Models\Specialization;
use App\Models\User;
use Database\Seeders\CountrySeeder;
use Database\Seeders\SchoolLevelSeeder;
use Database\Seeders\SpecializationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ParentProfileTest extends TestCase
{
    use RefreshDatabase;

    private User $parent;

    private Country $country;

    private SchoolLevel $schoolLevel;

    private Specialization $specialization;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([
            CountrySeeder::class,
            SchoolLevelSeeder::class,
            SpecializationSeeder::class,
        ]);

        $this->parent = User::factory()->create(['role' => 'parent']);
        $this->country = Country::first();
        $this->schoolLevel = SchoolLevel::first();
        $this->specialization = Specialization::first();
    }

    private function validPayload(): array
    {
        return [
            'country_id'              => $this->country->id,
            'timezone'                => 'Europe/Paris',
            'phone'                   => '+33612345678',
            'child_first_name'        => 'Lucas',
            'school_level_id'         => $this->schoolLevel->id,
            'specialization_id'       => $this->specialization->id,
            'child_brief'             => 'Besoin d\'accompagnement en lecture.',
            'consent_terms'           => true,
            'consent_data_processing' => true,
            'consent_marketing'       => false,
        ];
    }

    public function test_parent_peut_creer_son_profil(): void
    {
        $response = $this->actingAs($this->parent)
            ->postJson('/api/parent/profile', $this->validPayload());

        $response->assertStatus(201)
            ->assertJsonPath('profile.child_first_name', 'Lucas')
            ->assertJsonPath('profile.is_complete', true);

        $this->assertDatabaseHas('parent_profiles', [
            'user_id'          => $this->parent->id,
            'child_first_name' => 'Lucas',
            'consent_terms'    => true,
        ]);
    }

    public function test_parent_peut_consulter_son_profil(): void
    {
        ParentProfile::create([
            ...$this->validPayload(),
            'user_id'      => $this->parent->id,
            'consented_at' => now(),
        ]);

        $this->actingAs($this->parent)
            ->getJson('/api/parent/profile')
            ->assertOk()
            ->assertJsonPath('profile.child_first_name', 'Lucas')
            ->assertJsonPath('is_complete', true);
    }

    public function test_show_retourne_null_si_pas_de_profil(): void
    {
        $this->actingAs($this->parent)
            ->getJson('/api/parent/profile')
            ->assertOk()
            ->assertJsonPath('profile', null)
            ->assertJsonPath('is_complete', false);
    }

    public function test_parent_peut_mettre_a_jour_son_profil(): void
    {
        ParentProfile::create([
            ...$this->validPayload(),
            'user_id'      => $this->parent->id,
            'consented_at' => now(),
        ]);

        $this->actingAs($this->parent)
            ->putJson('/api/parent/profile', [
                ...$this->validPayload(),
                'child_first_name' => 'Emma',
            ])
            ->assertOk()
            ->assertJsonPath('profile.child_first_name', 'Emma');

        $this->assertDatabaseHas('parent_profiles', [
            'user_id'          => $this->parent->id,
            'child_first_name' => 'Emma',
        ]);
    }

    public function test_creation_echoue_si_profil_existe_deja(): void
    {
        ParentProfile::create([
            ...$this->validPayload(),
            'user_id'      => $this->parent->id,
            'consented_at' => now(),
        ]);

        $this->actingAs($this->parent)
            ->postJson('/api/parent/profile', $this->validPayload())
            ->assertStatus(409);
    }

    public function test_update_echoue_si_pas_de_profil(): void
    {
        $this->actingAs($this->parent)
            ->putJson('/api/parent/profile', $this->validPayload())
            ->assertStatus(404);
    }

    public function test_aesh_ne_peut_pas_acceder_au_profil_parent(): void
    {
        $aesh = User::factory()->create(['role' => 'aesh']);

        $this->actingAs($aesh)
            ->getJson('/api/parent/profile')
            ->assertStatus(403);

        $this->actingAs($aesh)
            ->postJson('/api/parent/profile', $this->validPayload())
            ->assertStatus(403);
    }

    public function test_validation_echoue_sans_consentements(): void
    {
        $payload = $this->validPayload();
        unset($payload['consent_terms'], $payload['consent_data_processing']);

        $this->actingAs($this->parent)
            ->postJson('/api/parent/profile', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['consent_terms', 'consent_data_processing']);
    }

    public function test_taxonomies_sont_accessibles_publiquement(): void
    {
        $this->getJson('/api/taxonomies')
            ->assertOk()
            ->assertJsonStructure([
                'countries' => [['id', 'code', 'name']],
                'specializations' => [['id', 'slug', 'name']],
                'school_levels' => [['id', 'slug', 'name', 'cycle']],
            ]);
    }
}
