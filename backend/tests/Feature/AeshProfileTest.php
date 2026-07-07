<?php

namespace Tests\Feature;

use App\Models\AeshProfile;
use App\Models\Country;
use App\Models\Language;
use App\Models\Modality;
use App\Models\SchoolLevel;
use App\Models\Specialization;
use App\Models\User;
use Database\Seeders\CountrySeeder;
use Database\Seeders\LanguageSeeder;
use Database\Seeders\ModalitySeeder;
use Database\Seeders\SchoolLevelSeeder;
use Database\Seeders\SpecializationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AeshProfileTest extends TestCase
{
    use RefreshDatabase;

    private User $aesh;

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

        $this->aesh = User::factory()->create(['role' => 'aesh']);
    }

    private function validPayload(): array
    {
        return [
            'bio'                => 'Accompagnante expérimentée auprès d\'élèves à besoins spécifiques depuis dix ans.',
            'hourly_rate'        => 35.5,
            'experience_years'   => 10,
            'timezone'           => 'Europe/Paris',
            'phone'              => '+33612345678',
            'specialization_ids' => [Specialization::first()->id],
            'language_ids'       => [Language::first()->id],
            'modality_ids'       => [Modality::first()->id],
            'country_ids'        => [Country::first()->id],
            'school_level_ids'   => [SchoolLevel::first()->id],
        ];
    }

    public function test_aesh_peut_creer_son_profil(): void
    {
        $response = $this->actingAs($this->aesh)
            ->postJson('/api/aesh/profile', $this->validPayload());

        $response->assertStatus(201)
            ->assertJsonPath('profile.hourly_rate', '35.50')
            ->assertJsonPath('profile.is_complete', true)
            ->assertJsonPath('profile.verification_status', 'pending');

        $this->assertDatabaseHas('aesh_profiles', ['user_id' => $this->aesh->id]);
        $this->assertDatabaseCount('aesh_profile_specialization', 1);
        $this->assertDatabaseCount('aesh_profile_language', 1);
    }

    public function test_aesh_peut_consulter_son_profil(): void
    {
        $this->actingAs($this->aesh)->postJson('/api/aesh/profile', $this->validPayload());

        $this->actingAs($this->aesh)
            ->getJson('/api/aesh/profile')
            ->assertOk()
            ->assertJsonPath('is_complete', true)
            ->assertJsonPath('profile.timezone', 'Europe/Paris');
    }

    public function test_show_retourne_null_si_pas_de_profil(): void
    {
        $this->actingAs($this->aesh)
            ->getJson('/api/aesh/profile')
            ->assertOk()
            ->assertJsonPath('profile', null)
            ->assertJsonPath('is_complete', false);
    }

    public function test_aesh_peut_mettre_a_jour_son_profil(): void
    {
        $this->actingAs($this->aesh)->postJson('/api/aesh/profile', $this->validPayload());

        $this->actingAs($this->aesh)
            ->putJson('/api/aesh/profile', [
                ...$this->validPayload(),
                'hourly_rate' => 42,
                'language_ids' => Language::limit(2)->pluck('id')->all(),
            ])
            ->assertOk()
            ->assertJsonPath('profile.hourly_rate', '42.00');

        $this->assertDatabaseCount('aesh_profile_language', 2);
    }

    public function test_creation_echoue_si_profil_existe_deja(): void
    {
        $this->actingAs($this->aesh)->postJson('/api/aesh/profile', $this->validPayload());

        $this->actingAs($this->aesh)
            ->postJson('/api/aesh/profile', $this->validPayload())
            ->assertStatus(409);
    }

    public function test_update_echoue_si_pas_de_profil(): void
    {
        $this->actingAs($this->aesh)
            ->putJson('/api/aesh/profile', $this->validPayload())
            ->assertStatus(404);
    }

    public function test_validation_echoue_sans_taxonomies(): void
    {
        $payload = $this->validPayload();
        unset($payload['specialization_ids'], $payload['language_ids']);

        $this->actingAs($this->aesh)
            ->postJson('/api/aesh/profile', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['specialization_ids', 'language_ids']);
    }

    public function test_validation_echoue_avec_bio_trop_courte(): void
    {
        $this->actingAs($this->aesh)
            ->postJson('/api/aesh/profile', [...$this->validPayload(), 'bio' => 'Trop court.'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['bio']);
    }

    public function test_parent_ne_peut_pas_acceder_au_profil_aesh(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);

        $this->actingAs($parent)
            ->getJson('/api/aesh/profile')
            ->assertStatus(403);

        $this->actingAs($parent)
            ->postJson('/api/aesh/profile', $this->validPayload())
            ->assertStatus(403);
    }

    public function test_profil_incomplet_si_aucune_modalite(): void
    {
        $profile = AeshProfile::create([
            'user_id'     => $this->aesh->id,
            'bio'         => 'Une présentation suffisamment longue pour passer la validation minimale requise.',
            'hourly_rate' => 30,
            'timezone'    => 'Europe/Paris',
        ]);
        $profile->specializations()->sync([Specialization::first()->id]);
        $profile->languages()->sync([Language::first()->id]);
        $profile->countries()->sync([Country::first()->id]);

        $this->assertFalse($profile->isComplete());
    }
}
