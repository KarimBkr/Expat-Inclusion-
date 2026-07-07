<?php

namespace Tests\Feature;

use App\Models\AeshDocument;
use App\Models\AeshProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AeshDocumentTest extends TestCase
{
    use RefreshDatabase;

    private User $aesh;

    private AeshProfile $profile;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->aesh = User::factory()->create(['role' => 'aesh']);
        $this->profile = AeshProfile::create([
            'user_id'     => $this->aesh->id,
            'bio'         => 'Une présentation suffisamment longue pour passer la validation minimale requise.',
            'hourly_rate' => 30,
            'timezone'    => 'Europe/Paris',
        ]);
    }

    public function test_aesh_peut_uploader_un_document(): void
    {
        $response = $this->actingAs($this->aesh)->postJson('/api/aesh/documents', [
            'type' => 'diploma',
            'file' => UploadedFile::fake()->create('diplome.pdf', 200, 'application/pdf'),
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('document.type', 'diploma')
            ->assertJsonPath('document.status', 'pending');

        $document = AeshDocument::first();
        $this->assertNotNull($document);
        Storage::disk('local')->assertExists($document->path);
    }

    public function test_upload_echoue_avec_mauvais_format(): void
    {
        $this->actingAs($this->aesh)->postJson('/api/aesh/documents', [
            'type' => 'diploma',
            'file' => UploadedFile::fake()->create('virus.exe', 100),
        ])->assertStatus(422)->assertJsonValidationErrors(['file']);
    }

    public function test_upload_impossible_sans_profil(): void
    {
        $aeshSansProfil = User::factory()->create(['role' => 'aesh']);

        $this->actingAs($aeshSansProfil)->postJson('/api/aesh/documents', [
            'type' => 'diploma',
            'file' => UploadedFile::fake()->create('diplome.pdf', 200, 'application/pdf'),
        ])->assertStatus(409);
    }

    public function test_aesh_peut_lister_ses_documents(): void
    {
        $this->actingAs($this->aesh)->postJson('/api/aesh/documents', [
            'type' => 'identity',
            'file' => UploadedFile::fake()->create('cni.pdf', 100, 'application/pdf'),
        ]);

        $this->actingAs($this->aesh)
            ->getJson('/api/aesh/documents')
            ->assertOk()
            ->assertJsonCount(1, 'documents')
            ->assertJsonPath('documents.0.type', 'identity');
    }

    public function test_aesh_peut_supprimer_un_document_en_attente(): void
    {
        $this->actingAs($this->aesh)->postJson('/api/aesh/documents', [
            'type' => 'other',
            'file' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
        ]);

        $document = AeshDocument::first();

        $this->actingAs($this->aesh)
            ->deleteJson("/api/aesh/documents/{$document->id}")
            ->assertOk();

        $this->assertDatabaseMissing('aesh_documents', ['id' => $document->id]);
        Storage::disk('local')->assertMissing($document->path);
    }

    public function test_document_valide_ne_peut_pas_etre_supprime(): void
    {
        $document = $this->profile->documents()->create([
            'type'          => 'diploma',
            'original_name' => 'diplome.pdf',
            'path'          => 'aesh-documents/1/diplome.pdf',
            'size'          => 1000,
            'status'        => 'approved',
        ]);

        $this->actingAs($this->aesh)
            ->deleteJson("/api/aesh/documents/{$document->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas('aesh_documents', ['id' => $document->id]);
    }

    public function test_aesh_ne_peut_pas_supprimer_le_document_d_un_autre(): void
    {
        $autreAesh = User::factory()->create(['role' => 'aesh']);
        $autreProfile = AeshProfile::create([
            'user_id'     => $autreAesh->id,
            'bio'         => 'Une présentation suffisamment longue pour passer la validation minimale requise.',
            'hourly_rate' => 40,
            'timezone'    => 'Europe/Paris',
        ]);
        $document = $autreProfile->documents()->create([
            'type'          => 'diploma',
            'original_name' => 'diplome.pdf',
            'path'          => 'aesh-documents/2/diplome.pdf',
            'size'          => 1000,
        ]);

        $this->actingAs($this->aesh)
            ->deleteJson("/api/aesh/documents/{$document->id}")
            ->assertStatus(403);
    }

    public function test_parent_ne_peut_pas_acceder_aux_documents(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);

        $this->actingAs($parent)
            ->getJson('/api/aesh/documents')
            ->assertStatus(403);
    }
}
