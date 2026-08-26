<?php

namespace App\Services;

use App\Models\BookingRequest;
use Google\Auth\Credentials\ServiceAccountCredentials;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Garantit l'existence du document Firestore d'une conversation, côté serveur.
 *
 * Les Security Rules interdisent toute création côté client : un participant
 * authentifié ne peut pas prouver depuis le navigateur qu'une demande a bien
 * été acceptée — cette vérité vit dans MySQL (`booking_status_histories`).
 * Laravel l'atteste donc une fois pour toutes en écrivant le document ; les
 * rules n'ont plus ensuite qu'à vérifier l'appartenance à `participant_ids`,
 * sans jamais revalider l'historique ni transporter de claim.
 *
 * Écrit via l'API REST Firestore plutôt que le SDK google/cloud-firestore
 * (non installé) : ce dernier embarque gRPC/protobuf pour un seul type de
 * document, alors que google/auth — déjà présent en dépendance transitive de
 * kreait/firebase-php — suffit à obtenir un jeton OAuth2 pour l'appeler.
 */
class ConversationProvisioner
{
    private const OAUTH_SCOPE = 'https://www.googleapis.com/auth/datastore';

    private const TOKEN_CACHE_KEY = 'firestore.oauth_access_token';

    private ?ServiceAccountCredentials $credentials = null;

    /**
     * Crée le document s'il n'existe pas encore ; ne touche à rien s'il existe
     * déjà.
     *
     * Écrit avec la précondition Firestore `currentDocument.exists=false` —
     * une création atomique côté serveur, pas un GET puis un PATCH séparés.
     * Un GET préalable exposait deux dangers réels : toute erreur transitoire
     * du GET (401 après expiration du jeton en cache, blip réseau, 5xx
     * Firestore) était traitée comme « le document n'existe pas », et le
     * PATCH qui suivait n'avait pas d'`updateMask` — donc réécrivait le
     * document en entier, effaçant silencieusement `last_message_at` /
     * `last_message_preview` / `last_message_sender_id` écrits entre-temps
     * par le client. Avec la précondition, Firestore lui-même refuse
     * l'écriture (`409 ALREADY_EXISTS`) si le document existe déjà — aucune
     * fenêtre de course possible, et le document existant n'est jamais
     * touché, quelle qu'en soit la raison.
     */
    public function ensure(BookingRequest $booking): void
    {
        $response = $this->createIfMissing($booking);

        if ($response->successful() || $this->alreadyExists($response)) {
            return;
        }

        throw new RuntimeException(sprintf(
            'Impossible de provisionner la conversation Firestore pour la demande #%d : %s',
            $booking->id,
            $response->body(),
        ));
    }

    private function createIfMissing(BookingRequest $booking): Response
    {
        $conversationId = FirebaseTokenService::conversationId($booking->id);
        $aeshUserId = $booking->aeshProfile?->user_id;
        $participantIds = array_values(array_filter([$booking->parent_id, $aeshUserId]));

        return Http::withToken($this->accessToken())
            ->patch($this->documentUrl($conversationId).'?currentDocument.exists=false', [
                'fields' => [
                    'booking_id' => ['integerValue' => (string) $booking->id],
                    'participant_ids' => [
                        'arrayValue' => [
                            'values' => array_map(
                                fn (int $id): array => ['stringValue' => (string) $id],
                                $participantIds,
                            ),
                        ],
                    ],
                    'parent_id' => ['stringValue' => (string) $booking->parent_id],
                    'aesh_user_id' => ['stringValue' => (string) $aeshUserId],
                    'created_at' => ['timestampValue' => now()->toIso8601String()],
                ],
            ]);
    }

    private function alreadyExists(Response $response): bool
    {
        return $response->status() === 409 && $response->json('error.status') === 'ALREADY_EXISTS';
    }

    private function documentUrl(string $conversationId): string
    {
        return sprintf(
            'https://firestore.googleapis.com/v1/projects/%s/databases/(default)/documents/conversations/%s',
            $this->credentials()->getProjectId(),
            $conversationId,
        );
    }

    private function accessToken(): string
    {
        return Cache::remember(self::TOKEN_CACHE_KEY, now()->addMinutes(50), function (): string {
            $token = $this->credentials()->fetchAuthToken();

            return $token['access_token'];
        });
    }

    /**
     * Seul point d'accès à google/auth — c'est le point que les tests
     * substituent pour éviter tout appel réseau réel ou lecture du fichier de
     * credentials en CI.
     */
    protected function credentials(): ServiceAccountCredentials
    {
        if ($this->credentials !== null) {
            return $this->credentials;
        }

        $project = config('firebase.default', 'app');

        return $this->credentials = new ServiceAccountCredentials(
            self::OAUTH_SCOPE,
            config("firebase.projects.{$project}.credentials"),
        );
    }
}
