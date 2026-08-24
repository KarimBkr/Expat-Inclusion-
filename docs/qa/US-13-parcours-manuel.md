# Parcours manuel QA — Messagerie Firestore (US-13)

Parcours de recette à rejouer avant chaque merge touchant la messagerie.
Complète les 8 tests API de `backend/tests/Feature/MessagingTest.php`.

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

## Contrôles d'accès à vérifier

| Test | Attendu |
|------|---------|
| `POST /api/firebase/token` sans session | `401` |
| `GET /api/bookings/{id}/conversation` par un tiers (ni parent ni AESH concerné) | `403` |
| `GET /api/bookings/{id}/conversation` sur une demande non acceptée (`requested`, `declined`, `cancelled`) | `422` |
| `GET /api/conversations` | Ne liste que les demandes **accepted** de l'utilisateur connecté |
| Firestore : lire `conversations/{id}` sans être dans `participant_ids` | Refusé par les Security Rules (`permission-denied` côté SDK) |
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

## Résultat du dernier passage

Exécuté le 24 août 2026 en local (backend `php artisan serve`, frontend
`npm run dev`, projet Firebase `expat-inclusion`) — parcours complet vert,
y compris le temps réel entre les deux threads, le badge non-lu et les
7 contrôles d'accès (API + Security Rules Firestore).
