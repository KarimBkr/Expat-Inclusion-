# Parcours manuel QA — Messagerie Firestore (US-13)

Parcours de recette à rejouer avant chaque merge touchant la messagerie.
Complète les 19 tests API de `backend/tests/Feature/MessagingTest.php` et
`backend/tests/Unit/Services/ConversationProvisionerTest.php`.

> Le provisionnement du document Firestore a été déplacé côté serveur
> (`ConversationProvisioner`) après la découverte d'un plafond de taille sur
> le custom token, d'une péremption de session et d'un trou d'autorisation —
> voir `docs/api/messaging.md`. Les points 11 à 13 ci-dessous couvrent
> spécifiquement ces corrections.

## Préparation de l'environnement

```bash
# 1. Infrastructure locale
orb start
docker compose up -d              # MySQL sur 3307, Mailpit sur 8025

# 2. Backend
cd backend
php artisan migrate --force
php artisan db:seed --force
php artisan serve                 # http://localhost:8000

# 3. Frontend
cd frontend
cp .env.example .env.local         # renseigner les clés NEXT_PUBLIC_FIREBASE_*
npm run dev                       # http://localhost:3000

# 4. Firestore Security Rules (projet Firebase réel, pas d'émulateur en local)
firebase deploy --only firestore:rules
```

> Les clés `NEXT_PUBLIC_FIREBASE_*` sont publiques (protégées par les Security
> Rules côté serveur) mais ne doivent jamais être commitées dans `.env.example`
> — uniquement dans `.env.local`, non versionné.

## Jeu de données

| Rôle   | Action                                                        |
|--------|----------------------------------------------------------------|
| AESH   | S'inscrire, compléter le profil, faire publier par l'admin     |
| Parent | S'inscrire, envoyer une demande, obtenir l'acceptation AESH    |

La messagerie n'existe que pour une demande au statut **accepted** (US-11/12).

## Parcours nominal

| # | Écran | Action | Attendu |
|---|-------|--------|---------|
| 1 | `/dashboard/parent/reservations` | Demande **acceptée** | Bouton « Ouvrir la conversation » visible |
| 2 | Idem côté `/dashboard/aesh/demandes` | Demande **acceptée** | Même bouton côté AESH |
| 3 | Cliquer sur le bouton (parent) | Ouverture du thread | Connexion Firebase transparente, aucune erreur console |
| 4 | Thread parent | Envoyer un message | Le message apparaît instantanément côté parent |
| 5 | Thread AESH (autre navigateur/session) | Ouvrir la même conversation | Le message du parent apparaît en temps réel |
| 6 | Thread AESH | Répondre | Le message apparaît côté parent sans rechargement |
| 7 | `/dashboard/parent` et `/dashboard/aesh` | Revenir au dashboard sans ouvrir le thread après un nouveau message reçu | La carte « Conversations » affiche « 1 non lu(s) » |
| 8 | `/dashboard/parent/conversations` | Inbox | Le badge « Nouveau » apparaît sur la conversation avec message non lu |
| 9 | Ouvrir la conversation depuis l'inbox | Lire le thread | Le badge disparaît immédiatement (marquage lu) et le dashboard repasse sans mention « non lu » au rechargement |
| 10 | Thread | Envoyer un message de 2001 caractères | Erreur front, pas d'écriture Firestore |
| 11 | Annuler une demande **acceptée** (bouton « Annuler ») | Retour sur `/dashboard/parent/reservations` ou `/dashboard/aesh/demandes` | Le bouton « Ouvrir la conversation » reste visible malgré le statut `cancelled` |
| 12 | Rouvrir cette conversation annulée | Thread | L'historique des messages précédents reste lisible des deux côtés |
| 13 | Créer une nouvelle demande puis l'annuler **sans qu'elle ait jamais été acceptée** | Tenter `/dashboard/parent/conversations/{id}` en URL directe | Page d'erreur d'accès (403) — aucun bouton « Ouvrir la conversation » n'existait de toute façon dans l'UI pour ce cas |

## Contrôles d'accès à vérifier

| Test | Attendu |
|------|---------|
| `POST /api/firebase/token` sans session | `401` |
| `POST /api/firebase/token` — réponse JSON | Ne contient plus `allowed_conversations` (identité seule) |
| `GET /api/bookings/{id}/conversation` par un tiers (ni parent ni AESH concerné) | `403` |
| `GET /api/bookings/{id}/conversation` sur une demande jamais acceptée (`requested`, `declined`, ou `cancelled` sans être passée par `accepted`) | `403` (plus `422` : c'est une question d'autorisation) |
| `GET /api/bookings/{id}/conversation` sur une demande **acceptée puis annulée** | `200` — l'accès survit à l'annulation |
| `GET /api/conversations` | Liste les demandes ayant **un jour été acceptées** de l'utilisateur connecté, y compris celles annulées depuis |
| Firestore : créer directement un document `conversations/{id}` depuis le client (console navigateur) | Refusé par les Security Rules (`allow create: if false` — plus aucune création côté client) |
| Firestore : lire `conversations/{id}` sans être dans `participant_ids` | Refusé par les Security Rules (`permission-denied` côté SDK) |
| Firestore : écrire `conversations/{id}/reads/{sonPropreUid}` | Autorisé |
| Firestore : écrire `conversations/{id}/reads/{autreUid}` | Refusé (on ne peut écrire que son propre marqueur de lecture) |
| Firestore : modifier `participant_ids` ou `booking_id` d'une conversation existante | Refusé (`allow update` verrouille ces champs) |

## Points de vigilance métier

- **Aucune donnée métier dans Firestore** : uniquement `conversations` et
  `messages` (+ `reads` pour le statut de lecture). Ne jamais y stocker de
  statut de réservation, de tarif ou de coordonnées.
- **Custom token éphémère** : vérifier qu'un utilisateur déconnecté côté
  Sanctum (`logout`) perd aussi sa session Firebase (`signOutFirebase` dans
  `auth-context.tsx`) — sinon le thread resterait accessible après logout côté
  onglet resté ouvert.
- **Notifications UI** : limitées à un badge non-lu (dashboard + inbox), pas
  d'écoute temps réel globale hors page conversation. Décision de scope MVP,
  à rouvrir si le besoin de notifications push apparaît.
- **Le client ne crée plus jamais de conversation.** Si un futur écran a
  besoin d'ouvrir un thread, il doit passer par
  `GET /api/bookings/{id}/conversation` (qui provisionne) avant de s'abonner à
  Firestore — jamais par un `setDoc` direct côté front, que les rules
  refuseraient de toute façon.
- **⚠️ Ordre de déploiement impératif.** Le fichier `firebase/firestore.rules`
  a été mis à jour dans le dépôt mais **pas déployé**
  (`firebase deploy --only firestore:rules`) — c'est une action sur un projet
  Firebase partagé, à décider consciemment. Ce déploiement doit précéder (ou,
  au minimum, accompagner) la mise en service du nouveau code Laravel : les
  anciennes rules exigent `conversationId in request.auth.token.allowed_conversations`
  même pour la **lecture**. Si le backend cesse d'émettre ce claim avant que
  les nouvelles rules soient en place, `allowed_conversations` devient
  indéfini et **toutes les lectures de conversation échouent pour tout le
  monde** (Firestore refuse par défaut une règle qui évalue un `in` sur une
  valeur absente). Déployer les rules d'abord n'a pas ce problème : la
  nouvelle règle ne dépend plus du tout du claim.

## Résultat du dernier passage

Exécuté le 24 août 2026 en local (backend `php artisan serve`, frontend
`npm run dev`, projet Firebase `expat-inclusion`) — parcours complet vert,
y compris le temps réel entre les deux threads, le badge non-lu et les
8 contrôles d'accès (API + Security Rules Firestore).

Les Security Rules ont aussi été vérifiées par script (custom token réel →
`signInWithCustomToken` → appels REST Firestore) contre le projet
`expat-inclusion` déployé, avec trois comptes réels (parent, AESH, tiers) :
création de conversation, envoi/lecture de message, refus du tiers, marqueur
de lecture. Ce test a révélé un bug réel — la règle `reads/{uid}` utilisait
`resource.data.participant_ids`, qui pointait vers le document `reads`
lui-même (sans ce champ) et non la conversation parente, bloquant tout accès
au marqueur de lecture même pour le bon participant. Corrigé via
`isParticipantOfParentConversation()` (relecture explicite de la conversation
parente par `get()`), redéployé, revalidé.

### 25 août 2026 — correction du provisionnement

126 tests backend verts (107 existants + 19 nouveaux : `MessagingTest`,
`ConversationProvisionerTest`, 4 cas `can_message`/`conversation_id` dans
`BookingRequestTest`), typecheck et lint front verts.

`ConversationProvisioner` vérifié en conditions réelles contre le projet
Firebase `expat-inclusion` (pas seulement via mocks) : jeton OAuth2 obtenu
pour de vrai via `google/auth` et le compte de service, document créé par un
premier appel, second appel confirmé no-op (`created_at` inchangé — preuve de
l'idempotence), suppression du document jetable. Aucune conversation réelle
touchée ; réservation de test annulée en base (rollback) après coup.

Non fait à ce stade, volontairement : le déploiement des nouvelles Security
Rules (`firebase deploy --only firestore:rules`) — voir l'avertissement sur
l'ordre de déploiement ci-dessus.

### 26 août 2026 — écriture atomique de `ConversationProvisioner`

Relecture a posteriori du GET-puis-PATCH de la veille : une erreur transitoire
du GET (faux négatif) suivie d'un PATCH sans `updateMask` aurait réécrit le
document en entier, effaçant `last_message_at`/`last_message_preview` écrits
par le client. `ensure()` tournant à chaque ouverture de thread, ce n'était
qu'une question de temps avant que ça arrive en usage réel.

Corrigé en une seule écriture atomique (`PATCH …?currentDocument.exists=false`
— voir `docs/api/messaging.md`). 127 tests verts. Revérifié en conditions
réelles contre `expat-inclusion` avec un scénario reproduisant exactement le
bug : `ensure()` appelé une seconde fois après qu'un message a été envoyé —
`last_message_preview` reste intact. Security Rules déjà déployées la veille
inchangées par ce correctif (aucune rule ne dépendait du GET préalable).
