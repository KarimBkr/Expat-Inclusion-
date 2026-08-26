# Emails transactionnels & notifications dashboard (US-16)

Chaque événement métier (inscription, cycle de vie d'une demande) déclenche
une classe `Illuminate\Notifications\Notification` dédiée dans
`App\Notifications`, mise en queue (`ShouldQueue`) et envoyée sur deux
canaux : `mail` (template brandé, `App\Mail\*`) et `database` (table
`notifications`, alimente le dashboard).

Les emails de vérification de compte et de réinitialisation de mot de passe
restent portés par les événements/mécanismes natifs de Laravel
(`Registered`, `Password::sendResetLink`) mais avec un rendu et une mise en
queue custom — voir `App\Models\User::sendEmailVerificationNotification()`
et `sendPasswordResetNotification()`.

L'email de paiement n'existe pas encore : bloqué sur US-14/15 (aucun modèle
`Payment`). À ajouter dans `BookingRequestService`-équivalent côté paiement
une fois le webhook Stripe livré.

## Déclencheurs

| Notification | Déclenchée dans | Destinataire |
|---|---|---|
| `VerifyEmailNotification` | `Registered` (inscription) / `resendVerification()` | L'utilisateur qui s'inscrit |
| `ResetPasswordNotification` | `Password::sendResetLink()` | L'utilisateur qui demande le reset |
| `BookingRequestReceivedNotification` | `BookingRequestService::create()` | AESH destinataire |
| `BookingRequestAcceptedNotification` | `BookingRequestService::transition()`, cible `accepted` | Parent auteur |
| `BookingRequestDeclinedNotification` | idem, cible `declined` | Parent auteur |
| `BookingRequestCancelledNotification` | idem, cible `cancelled` | **L'autre partie que l'acteur** — jamais celui qui annule |

Les notifications `mail`+`database` (les 4 dernières) écrivent aussi une
ligne dans `notifications` (`toArray()`), consommée par les endpoints
ci-dessous. `VerifyEmailNotification`/`ResetPasswordNotification` ne
passent que par `mail` (événements pré-connexion, rien à afficher sur un
dashboard).

Payload `data` (colonne JSON) :

```json
{
  "type": "booking_request_accepted",
  "booking_id": 12,
  "message": "Samira B. a accepté votre demande.",
  "url": "/dashboard/parent/conversations/12"
}
```

`type` est un slug métier stable, distinct de la colonne `type` de Laravel
(FQCN de la classe) — le frontend n'a jamais besoin de connaître les noms de
classes PHP.

## Gestion d'erreurs

Chaque notification définit `failed(Throwable $exception): void`, loggué via
`Log::error(...)` avec le contexte (booking, type). Les échecs de queue
tombent par ailleurs dans `failed_jobs` (table du Sprint 0) — pas de table
de logs mail dédiée, ce serait de la sur-ingénierie pour ce besoin.

---

## GET /api/notifications

Authentifié. Liste paginée (20/page) des notifications de l'utilisateur
courant, plus récentes d'abord.

```json
{
  "data": { "data": [ { "id": "…", "type": "…", "data": {...}, "read_at": null, "created_at": "…" } ], "...pagination Laravel standard..." },
  "unread_count": 3
}
```

## POST /api/notifications/{id}/read

Marque une notification comme lue. Scope sur `$user->notifications()` :
`404` (pas `403`) si la notification n'appartient pas à l'utilisateur — son
existence même n'est pas révélée à un tiers.

## POST /api/notifications/read-all

Marque toutes les notifications non lues de l'utilisateur courant comme lues.

---

## Vérification d'email — flux du lien

`VerifyEmail::createUrlUsing` (dans `AppServiceProvider`) fait pointer le
lien emailé vers une page frontend
(`/verifier-email/confirmer/{id}/{hash}?expires=…&signature=…`) plutôt que
directement vers l'endpoint API (`GET /api/email/verify/{id}/{hash}`, qui
renvoie du JSON brut). La page relaie ensuite exactement les mêmes
paramètres signés à l'API via `fetch`. Comme cet endpoint est derrière
`auth:sanctum`, un utilisateur qui ouvre le lien sans session active voit un
message l'invitant à se reconnecter plutôt qu'un 401 silencieux.
