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

class AeshSearchTest extends TestCase
{
    use RefreshDatabase;

    private User $parent;

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
        $this->parent = User::factory()->create(['role' => 'parent']);
    }

    private function makeProfile(string $status, array $relations = []): AeshProfile
    {
        $aesh = User::factory()->create(['role' => 'aesh']);
        $profile = AeshProfile::create([
            'user_id'             => $aesh->id,
            'bio'                 => 'Accompagnante spécialisée avec une solide expérience de terrain.',
            'timezone'            => 'Europe/Paris',
            'phone'               => '+33612345678',
            'verification_status' => $status,
            'published_at'        => $status === AeshProfile::STATUS_PUBLISHED ? now() : null,
        ]);
        foreach ($relations as $method => $ids) {
            $profile->{$method}()->sync($ids);
        }

        return $profile;
    }

    public function test_seuls_les_profils_publies_sont_retournes(): void
    {
        $this->makeProfile(AeshProfile::STATUS_PUBLISHED);
        $this->makeProfile(AeshProfile::STATUS_PENDING);
        $this->makeProfile(AeshProfile::STATUS_APPROVED);
        $this->makeProfile(AeshProfile::STATUS_REJECTED);

        $this->actingAs($this->parent)
            ->getJson('/api/parent/aesh-search')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.verification_status', 'published');
    }

    public function test_filtre_par_pays(): void
    {
        $fr = Country::where('code', 'FR')->first()->id;
        $other = Country::where('code', '!=', 'FR')->first()->id;

        $this->makeProfile(AeshProfile::STATUS_PUBLISHED, ['countries' => [$fr]]);
        $this->makeProfile(AeshProfile::STATUS_PUBLISHED, ['countries' => [$other]]);

        $this->actingAs($this->parent)
            ->getJson("/api/parent/aesh-search?country_id={$fr}")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_filtre_par_specialisation_et_modalite(): void
    {
        $spec = Specialization::first()->id;
        $modality = Modality::first()->id;

        $this->makeProfile(AeshProfile::STATUS_PUBLISHED, [
            'specializations' => [$spec],
            'modalities'      => [$modality],
        ]);
        $this->makeProfile(AeshProfile::STATUS_PUBLISHED);

        $this->actingAs($this->parent)
            ->getJson("/api/parent/aesh-search?specialization_id={$spec}&modality_id={$modality}")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_filtre_par_niveau_scolaire(): void
    {
        $level = SchoolLevel::first()->id;
        $this->makeProfile(AeshProfile::STATUS_PUBLISHED, ['schoolLevels' => [$level]]);
        $this->makeProfile(AeshProfile::STATUS_PUBLISHED);

        $this->actingAs($this->parent)
            ->getJson("/api/parent/aesh-search?school_level_id={$level}")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_pagination(): void
    {
        foreach (range(1, 13) as $i) {
            $this->makeProfile(AeshProfile::STATUS_PUBLISHED);
        }

        $response = $this->actingAs($this->parent)
            ->getJson('/api/parent/aesh-search')
            ->assertOk()
            ->assertJsonCount(12, 'data');

        $response->assertJsonPath('meta.total', 13)
            ->assertJsonPath('meta.per_page', 12);
    }

    public function test_aucune_donnee_de_contact_exposee(): void
    {
        $this->makeProfile(AeshProfile::STATUS_PUBLISHED, ['languages' => [Language::first()->id]]);

        $response = $this->actingAs($this->parent)->getJson('/api/parent/aesh-search')->assertOk();

        $json = $response->json('data.0');
        $this->assertArrayNotHasKey('phone', $json);
        $this->assertArrayNotHasKey('email', $json);
        $this->assertArrayNotHasKey('timezone', $json);
        $this->assertArrayHasKey('name', $json);
    }

    public function test_aesh_ne_peut_pas_utiliser_la_recherche_parent(): void
    {
        $aesh = User::factory()->create(['role' => 'aesh']);
        $this->actingAs($aesh)
            ->getJson('/api/parent/aesh-search')
            ->assertStatus(403);
    }

    public function test_filtre_invalide_rejete(): void
    {
        $this->actingAs($this->parent)
            ->getJson('/api/parent/aesh-search?country_id=999999')
            ->assertStatus(422);
    }

    public function test_resultats_vides_sans_erreur(): void
    {
        $this->actingAs($this->parent)
            ->getJson('/api/parent/aesh-search')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
