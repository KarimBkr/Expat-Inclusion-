<?php

namespace Tests\Feature;

use App\Models\AeshProfile;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AeshCsvImportTest extends TestCase
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
        Notification::fake();
    }

    private const HEADER = 'name,email,bio,experience_years,timezone,phone,specialization_slugs,language_codes,modality_slugs,country_codes,school_level_slugs';

    private function csv(string $content): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('aesh.csv', self::HEADER."\n".$content);
    }

    private function validRow(string $email = 'samira@example.com'): string
    {
        return implode(',', [
            'Samira Benali',
            $email,
            '"Accompagnante spécialisée depuis dix ans, dont sept au sein du réseau AEFE au Moyen-Orient."',
            '10',
            'Europe/Paris',
            '+33612345678',
            '"tsa;tdah"',
            '"fr;en"',
            '"presentiel;distanciel"',
            '"FR;MA"',
            '',
        ]);
    }

    public function test_admin_importe_un_profil_valide(): void
    {
        $csv = $this->csv($this->validRow());

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/aesh-import', ['file' => $csv])
            ->assertOk();

        $response->assertJsonCount(1, 'imported')
            ->assertJsonCount(0, 'errors')
            ->assertJsonPath('imported.0.email', 'samira@example.com')
            ->assertJsonPath('imported.0.row', 2);

        $user = User::where('email', 'samira@example.com')->first();
        $this->assertNotNull($user);
        $this->assertSame('aesh', $user->role);

        $profile = AeshProfile::where('user_id', $user->id)->first();
        $this->assertNotNull($profile);
        $this->assertSame(AeshProfile::STATUS_PENDING, $profile->verification_status);
        $this->assertSame(10, $profile->experience_years);
        $this->assertDatabaseCount('aesh_profile_specialization', 2);
        $this->assertDatabaseCount('aesh_profile_country', 2);
    }

    public function test_le_mot_de_passe_genere_nest_jamais_expose(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/aesh-import', ['file' => $this->csv($this->validRow())])
            ->assertOk();

        $this->assertStringNotContainsString('password', strtolower(json_encode($response->json())));
    }

    public function test_import_partiel_une_ligne_valide_une_invalide(): void
    {
        $rows = $this->validRow('valide@example.com')."\n".implode(',', [
            'Trop Court',
            'invalide@example.com',
            'Bio trop courte.',
            '5',
            'Europe/Paris',
            '',
            '"tsa"',
            '"fr"',
            '"presentiel"',
            '"FR"',
            '',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/aesh-import', ['file' => $this->csv($rows)])
            ->assertOk();

        $response->assertJsonCount(1, 'imported')
            ->assertJsonCount(1, 'errors')
            ->assertJsonPath('errors.0.row', 3);

        $this->assertNotNull(User::where('email', 'valide@example.com')->first());
        $this->assertNull(User::where('email', 'invalide@example.com')->first());
    }

    public function test_email_deja_utilise_rejete_sans_bloquer_les_autres_lignes(): void
    {
        User::factory()->create(['email' => 'existe-deja@example.com', 'role' => 'aesh']);

        $rows = $this->validRow('existe-deja@example.com')."\n".$this->validRow('nouveau@example.com');

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/aesh-import', ['file' => $this->csv($rows)])
            ->assertOk();

        $response->assertJsonCount(1, 'imported')
            ->assertJsonCount(1, 'errors')
            ->assertJsonPath('imported.0.email', 'nouveau@example.com');
    }

    public function test_doublon_demail_dans_le_meme_fichier_rejete_sur_la_seconde_ligne(): void
    {
        $rows = $this->validRow('doublon@example.com')."\n".$this->validRow('doublon@example.com');

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/aesh-import', ['file' => $this->csv($rows)])
            ->assertOk();

        $response->assertJsonCount(1, 'imported')
            ->assertJsonCount(1, 'errors');

        $this->assertSame(1, User::where('email', 'doublon@example.com')->count());
    }

    public function test_specialisation_inconnue_rejetee_avec_message_explicite(): void
    {
        $row = str_replace('"tsa;tdah"', '"tsa;inexistant"', $this->validRow());

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/aesh-import', ['file' => $this->csv($row)])
            ->assertOk();

        $response->assertJsonCount(0, 'imported')
            ->assertJsonCount(1, 'errors');

        $this->assertStringContainsString('inexistant', $response->json('errors.0.errors.0'));
    }

    public function test_colonnes_manquantes_rejetees_avant_tout_traitement(): void
    {
        $csv = UploadedFile::fake()->createWithContent('aesh.csv', "name,email\nSamira,samira@example.com");

        $this->actingAs($this->admin)
            ->postJson('/api/admin/aesh-import', ['file' => $csv])
            ->assertStatus(422);

        $this->assertDatabaseCount('users', 2); // admin + parent du setUp, aucun ajouté
    }

    public function test_fichier_non_csv_refuse(): void
    {
        $file = UploadedFile::fake()->create('profil.pdf', 100, 'application/pdf');

        $this->actingAs($this->admin)
            ->postJson('/api/admin/aesh-import', ['file' => $file])
            ->assertStatus(422);
    }

    public function test_parent_ne_peut_pas_importer(): void
    {
        $this->actingAs($this->parent)
            ->postJson('/api/admin/aesh-import', ['file' => $this->csv($this->validRow())])
            ->assertStatus(403);
    }

    public function test_visiteur_non_authentifie_refuse(): void
    {
        $this->postJson('/api/admin/aesh-import', ['file' => $this->csv($this->validRow())])
            ->assertStatus(401);
    }
}
