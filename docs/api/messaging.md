# Messagerie Firestore — Endpoints (US-13)

Messagerie temps réel liée à une **demande de réservation qui a été acceptée**
— y compris si elle a ensuite été annulée : l'historique des échanges ne
disparaît pas parce que la réservation a changé de statut. Firebase =
conversations / messages uniquement. Laravel reste seul juge de l'accès : les
Security Rules ne revalident jamais l'historique, elles vérifient uniquement
l'appartenance à un document que Laravel a déjà provisionné.

## Flux imposé

```
1. Sanctum login (cookie)
2. POST /api/firebase/token              → custom token (identité seule)
3. Front : signInWithCustomToken
4. GET  /api/conversations               → inbox (demandes ayant été acceptées)
5. GET  /api/bookings/{id}/conversation  → provisionne le document Firestore
                                            si besoin, puis renvoie ses métadonnées
6. Firestore : conversations/{booking_{id}}/messages
```

ID de conversation : `booking_{bookingRequest.id}`
UID Firebase : `String(users.id)` Laravel.

---

## Pourquoi il n'y a plus de claim `allowed_conversations`

La première version d'US-13 autorisait la création du document Firestore via
un claim du custom token listant les conversations ouvertes. Deux défauts
structurels, découverts après coup :

- **Plafond** : les claims Firebase sont limités à 1000 octets. La liste
  grossissant avec chaque demande acceptée, elle dépassait cette limite vers
  la 70ᵉ demande — panne franche, plus aucune conversation accessible.
- **Péremption** : les claims sont figés à l'émission du token. Une demande
  acceptée pendant qu'une session est déjà ouverte n'apparaissait dans le
  claim qu'après reconnexion.
- **Trou d'autorisation** : le claim se construisait sur le **statut courant**
  (`status === accepted`), pas sur l'historique. Une demande annulée — qu'elle
  ait ou non été acceptée auparavant — sortait du filtre. Une famille perdait
  l'accès à un historique légitime après une annulation, et rien ne
  garantissait qu'une demande annulée *avant* toute acceptation ne puisse pas
  se voir attribuer une conversation a posteriori.

La correction déplace la décision côté Laravel, seule source de vérité pour
les bookings (`booking_status_histories`) : `ConversationProvisioner` écrit le
document une fois pour toutes, via l'API REST Firestore, après vérification
par `BookingRequestPolicy::converse()` que la demande **a un jour été
acceptée** (`BookingRequest::wasAccepted()`). Les rules n'ont plus besoin
d'aucun claim — seulement de vérifier que l'UID appelant figure dans
`participant_ids` du document déjà écrit.

---

## POST /api/firebase/token

Authentifié (`auth:sanctum`). Rate limit 30/min.

Émet un custom token Firebase ne portant que l'identité — aucune liste, donc
aucune limite de taille ni péremption possible.

```json
{
  "token": "eyJ...",
  "uid": "4"
}
```

| Code | Cas |
|------|-----|
| 200 | Token émis |
| 401 | Non authentifié |

---

## GET /api/conversations

Inbox des threads ouverts : demandes ayant **un jour été acceptées**
(`wasAccepted()`), y compris si elles sont depuis passées à `cancelled`.

```json
{
  "data": [
    {
      "conversation_id": "booking_12",
      "booking_id": 12,
      "status": "accepted",
      "participant_ids": ["4", "7"],
      "parent_id": "4",
      "aesh_user_id": "7",
      "peer": { "id": 7, "name": "Samira B." },
      "created_at": "2026-08-06T09:14:00+00:00"
    }
  ]
}
```

---

## GET /api/bookings/{booking}/conversation

Métadonnées d'un thread. Autorisé via `BookingRequestPolicy::converse()` :
participant (parent auteur ou AESH destinataire) **et** demande ayant un jour
été acceptée. Garantit que le document Firestore existe avant de répondre —
`ConversationProvisioner::ensure()` le crée s'il est absent, ne touche à rien
s'il existe déjà.

| Code | Cas |
|------|-----|
| 200 | OK — document garanti existant |
| 401 | Non authentifié |
| 403 | Pas participant, ou demande jamais acceptée |

> Le `422` « demande non acceptée » de la première version a disparu : ce
> n'est pas une erreur de validation, c'est une question d'autorisation —
> une demande qui n'a jamais été acceptée ne donne simplement pas accès à la
> messagerie.

---

## Firestore

Collections :

```
conversations/{booking_{id}}
  booking_id, participant_ids, parent_id, aesh_user_id,
  created_at, last_message_at, last_message_preview, last_message_sender_id
  messages/{autoId}
    sender_id, text, created_at
  reads/{uid}
    last_read_at
```

`reads/{uid}` porte le marqueur de lecture par participant (badge « non lu » côté
front). Un utilisateur ne peut écrire que son propre document (`uid` = son UID
Firebase).

**Le client ne crée jamais de conversation** (`allow create: if false`) — seul
Laravel écrit ce document, via l'API REST Firestore (`google/auth` pour le
jeton OAuth2 du compte de service ; pas de dépendance `google/cloud-firestore`,
non installée, pour un seul type de document). Le client peut en revanche
mettre à jour les métadonnées de dernier message (`allow update`, verrouillé
sur `participant_ids`/`booking_id`) et écrire ses propres messages et son
propre marqueur de lecture.

Security Rules : `firebase/firestore.rules`
→ accès en lecture/écriture si `auth.uid` ∈ `participant_ids` du document —
plus aucune référence à un claim du token.

---

## Frontend

- `/dashboard/parent/conversations` · `/dashboard/parent/conversations/[bookingId]`
- `/dashboard/aesh/conversations` · `/dashboard/aesh/conversations/[bookingId]`
- Lien « Ouvrir la conversation » sur les demandes acceptées
