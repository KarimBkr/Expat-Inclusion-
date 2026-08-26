<?php

namespace Tests\Unit\Services;

use App\Enums\BookingStatus;
use App\Models\AeshProfile;
use App\Models\BookingRequest;
use App\Models\Modality;
use App\Models\SchoolLevel;
use App\Models\User;
use App\Services\ConversationProvisioner;
use Database\Seeders\CountrySeeder;
use Database\Seeders\LanguageSeeder;
use Database\Seeders\ModalitySeeder;
use Database\Seeders\SchoolLevelSeeder;
use Database\Seeders\SpecializationSeeder;
use Google\Auth\Credentials\ServiceAccountCredentials;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Mockery;
use RuntimeException;
use Tests\TestCase;

/**
 * `ConversationProvisioner` parle à l'API REST Firestore, pas au SDK
 * google/cloud-firestore (absent du projet). `credentials()` — seul point de
 * contact avec google/auth — est substitué par un double afin qu'aucun test
 * ne lise le fichier de service account ni n'appelle l'endpoint OAuth réel de
 * Google : `FIREBASE_CREDENTIALS` vaut d'ailleurs une chaîne vide en
 * environnement de test (voir phpunit.xml), ce double est donc indispensable
 * et pas une simple facilité.
 */
class ConversationProvisionerTest extends TestCase
{
    use RefreshDatabase;

    private function provisioner(): ConversationProvisioner
    {
        $credentials = Mockery::mock(ServiceAccountCredentials::class);
        $credentials->shouldReceive('getProjectId')->andReturn('expat-inclusion-test');
        $credentials->shouldReceive('fetchAuthToken')->andReturn(['access_token' => 'fake-access-token']);

        $provisioner = Mockery::mock(ConversationProvisioner::class)->makePartial();
        $provisioner->shouldAllowMockingProtectedMethods();
        $provisioner->shouldReceive('credentials')->andReturn($credentials);

        return $provisioner;
    }

    private function makeBooking(): BookingRequest
    {
        $this->seed([
            CountrySeeder::class,
            SpecializationSeeder::class,
            LanguageSeeder::class,
            SchoolLevelSeeder::class,
            ModalitySeeder::class,
        ]);

        $parent = User::factory()->create(['role' => 'parent']);
        $aesh = User::factory()->create(['role' => 'aesh']);
        $profile = AeshProfile::create([
            'user_id' => $aesh->id,
            'bio' => 'Accompagnante spécialisée pour le test de provisionnement.',
            'timezone' => 'Europe/Paris',
            'verification_status' => AeshProfile::STATUS_PUBLISHED,
            'published_at' => now(),
        ]);

        return BookingRequest::create([
            'parent_id' => $parent->id,
            'aesh_profile_id' => $profile->id,
            'status' => BookingStatus::Accepted,
            'message' => 'Nous cherchons un accompagnement.',
            'modality_id' => Modality::first()->id,
            'school_level_id' => SchoolLevel::first()->id,
            'start_date' => now()->addWeek()->toDateString(),
            'hours_per_week' => 6,
            'responded_at' => now(),
        ]);
    }

    private function documentUrl(BookingRequest $booking): string
    {
        return "https://firestore.googleapis.com/v1/projects/expat-inclusion-test/databases/(default)/documents/conversations/booking_{$booking->id}";
    }

    public function test_cree_le_document_si_absent(): void
    {
        $booking = $this->makeBooking()->load('aeshProfile');
        $url = $this->documentUrl($booking);

        Http::fake([$url.'*' => Http::response(['fields' => []], 200)]);

        $this->provisioner()->ensure($booking);

        Http::assertSent(function ($request) use ($url, $booking) {
            if ($request->method() !== 'PATCH' || ! str_starts_with($request->url(), $url)) {
                return false;
            }

            // La précondition est ce qui rend la création atomique : sans
            // elle, une écriture concurrente pourrait en écraser une autre.
            if (! str_contains($request->url(), 'currentDocument.exists=false')) {
                return false;
            }

            $fields = $request->data()['fields'];
            $participantIds = array_column($fields['participant_ids']['arrayValue']['values'], 'stringValue');

            return $fields['booking_id']['integerValue'] === (string) $booking->id
                && $fields['parent_id']['stringValue'] === (string) $booking->parent_id
                && $fields['aesh_user_id']['stringValue'] === (string) $booking->aeshProfile->user_id
                && $participantIds === [(string) $booking->parent_id, (string) $booking->aeshProfile->user_id];
        });
    }

    /**
     * Régression : avant l'introduction de la précondition Firestore, un
     * document déjà existant pouvait être réécrit en entier (PATCH sans
     * updateMask), effaçant `last_message_at` et les autres métadonnées
     * écrites par le client entre-temps. Avec `currentDocument.exists=false`,
     * Firestore refuse lui-même l'écriture : `ensure()` doit traiter ce refus
     * comme un succès silencieux, jamais comme une erreur.
     */
    public function test_ne_leve_pas_derreur_si_le_document_existe_deja(): void
    {
        $booking = $this->makeBooking();
        $url = $this->documentUrl($booking);

        Http::fake([$url.'*' => Http::response([
            'error' => ['code' => 409, 'message' => 'Document already exists', 'status' => 'ALREADY_EXISTS'],
        ], 409)]);

        $this->provisioner()->ensure($booking);

        $this->addToAssertionCount(1); // aucune exception levée = comportement attendu
    }

    /**
     * Un 409 n'est traité comme « déjà créé » que s'il porte précisément le
     * statut `ALREADY_EXISTS` — pas n'importe quel conflit. Un check trop
     * large avalerait silencieusement d'autres erreurs Firestore.
     */
    public function test_un_409_dune_autre_nature_reste_une_erreur(): void
    {
        $booking = $this->makeBooking();
        $url = $this->documentUrl($booking);

        Http::fake([$url.'*' => Http::response([
            'error' => ['code' => 409, 'message' => 'Concurrent transaction', 'status' => 'ABORTED'],
        ], 409)]);

        $this->expectException(RuntimeException::class);

        $this->provisioner()->ensure($booking);
    }

    public function test_leve_une_exception_si_lecriture_echoue(): void
    {
        $booking = $this->makeBooking();
        $url = $this->documentUrl($booking);

        Http::fake([$url.'*' => Http::response(['error' => 'permission denied'], 403)]);

        $this->expectException(RuntimeException::class);

        $this->provisioner()->ensure($booking);
    }
}
