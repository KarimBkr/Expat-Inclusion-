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

    public function test_cree_le_document_si_absent(): void
    {
        $booking = $this->makeBooking()->load('aeshProfile');
        $url = "https://firestore.googleapis.com/v1/projects/expat-inclusion-test/databases/(default)/documents/conversations/booking_{$booking->id}";

        Http::fake([
            $url => Http::sequence()
                ->push('', 404)               // GET : le document n'existe pas encore
                ->push(['fields' => []], 200), // PATCH : création
        ]);

        $this->provisioner()->ensure($booking);

        Http::assertSent(fn ($request) => $request->method() === 'GET' && $request->url() === $url);

        Http::assertSent(function ($request) use ($url, $booking) {
            if ($request->method() !== 'PATCH' || $request->url() !== $url) {
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

    public function test_ne_reecrit_pas_si_le_document_existe_deja(): void
    {
        $booking = $this->makeBooking();
        $url = "https://firestore.googleapis.com/v1/projects/expat-inclusion-test/databases/(default)/documents/conversations/booking_{$booking->id}";

        Http::fake([
            $url => Http::response(['fields' => []], 200),
        ]);

        $this->provisioner()->ensure($booking);

        Http::assertNotSent(fn ($request) => $request->method() === 'PATCH');
    }

    public function test_leve_une_exception_si_lecriture_echoue(): void
    {
        $booking = $this->makeBooking();
        $url = "https://firestore.googleapis.com/v1/projects/expat-inclusion-test/databases/(default)/documents/conversations/booking_{$booking->id}";

        Http::fake([
            $url => Http::sequence()
                ->push('', 404)
                ->push(['error' => 'permission denied'], 403),
        ]);

        $this->expectException(RuntimeException::class);

        $this->provisioner()->ensure($booking);
    }
}
