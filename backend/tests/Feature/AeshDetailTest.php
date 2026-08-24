<?php

namespace Tests\Feature;

use App\Models\AeshDocument;
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

class AeshDetailTest extends TestCase
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

    private function makeProfile(string $status): AeshProfile
    {
        $aesh = User::factory()->create(['role' => 'aesh', 'name' => 'Samira Benali']);
        $profile = AeshProfile::create([
            'user_id'             => $aesh->id,
            'bio'                 => 'Accompagnante spécialisée TSA avec dix ans de terrain en réseau AEFE.',
            'experience_years'    => 10,
            'timezone'            => 'Europe/Paris',
            'phone'               => '+33612345678',
            'verification_status' => $status,
            'published_at'        => $status === AeshProfile::STATUS_PUBLISHED ? now() : null,
        ]);

        $profile->specializations()->sync([Specialization::first()->id]);
        $profile->languages()->sync([Language::first()->id]);
        $profile->modalities()->sync([Modality::first()->id]);
        $profile->countries()->sync([Country::first()->id]);
        $profile->schoolLevels()->sync([SchoolLevel::first()->id]);

        return $profile;
    }

    public function test_parent_consulte_une_fiche_publiee(): void
    {
        $profile = $this->makeProfile(AeshProfile::STATUS_PUBLISHED);

        $this->actingAs($this->parent)
            ->getJson("/api/parent/aesh-profiles/{$profile->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $profile->id)
            ->assertJsonPath('data.name', 'Samira Benali')
            ->assertJsonPath('data.experience_years', 10)
            ->assertJsonPath('data.verification_status', 'published')
            ->assertJsonCount(1, 'data.specializations')
            ->assertJsonCount(1, 'data.languages')
            ->assertJsonCount(1, 'data.modalities')
            ->assertJsonCount(1, 'data.countries')
            ->assertJsonCount(1, 'data.school_levels');
    }

    public function test_un_profil_non_publie_est_introuvable(): void
    {
        foreach ([AeshProfile::STATUS_PENDING, AeshProfile::STATUS_APPROVED, AeshProfile::STATUS_REJECTED] as $status) {
            $profile = $this->makeProfile($status);

            $this->actingAs($this->parent)
                ->getJson("/api/parent/aesh-profiles/{$profile->id}")
                ->assertStatus(404);
        }
    }

    public function test_profil_inexistant_renvoie_404(): void
    {
        $this->actingAs($this->parent)
            ->getJson('/api/parent/aesh-profiles/999999')
            ->assertStatus(404);
    }

    public function test_aucune_donnee_de_contact_exposee(): void
    {
        $profile = $this->makeProfile(AeshProfile::STATUS_PUBLISHED);

        $json = $this->actingAs($this->parent)
            ->getJson("/api/parent/aesh-profiles/{$profile->id}")
            ->assertOk()
            ->json('data');

        $this->assertArrayNotHasKey('phone', $json);
        $this->assertArrayNotHasKey('email', $json);
        $this->assertArrayNotHasKey('user_id', $json);
    }

    /**
     * La fiche n'annonce aucune vérification de pièces : seuls un CV et une
     * lettre de motivation sont collectés, et ils ne sont jamais exposés.
     */
    public function test_aucune_information_sur_les_documents_exposee(): void
    {
        $profile = $this->makeProfile(AeshProfile::STATUS_PUBLISHED);

        AeshDocument::create([
            'aesh_profile_id' => $profile->id,
            'type'            => AeshDocument::TYPE_CV,
            'original_name'   => 'cv.pdf',
            'path'            => 'documents/cv.pdf',
            'size'            => 1024,
            'status'          => AeshDocument::STATUS_APPROVED,
        ]);

        $json = $this->actingAs($this->parent)
            ->getJson("/api/parent/aesh-profiles/{$profile->id}")
            ->assertOk()
            ->json('data');

        $this->assertArrayNotHasKey('documents_verified', $json);
        $this->assertArrayNotHasKey('documents', $json);
    }

    public function test_aesh_ne_peut_pas_consulter_la_fiche_parent(): void
    {
        $profile = $this->makeProfile(AeshProfile::STATUS_PUBLISHED);
        $aesh = User::factory()->create(['role' => 'aesh']);

        $this->actingAs($aesh)
            ->getJson("/api/parent/aesh-profiles/{$profile->id}")
            ->assertStatus(403);
    }

    public function test_visiteur_non_authentifie_refuse(): void
    {
        $profile = $this->makeProfile(AeshProfile::STATUS_PUBLISHED);

        $this->getJson("/api/parent/aesh-profiles/{$profile->id}")
            ->assertStatus(401);
    }
}
