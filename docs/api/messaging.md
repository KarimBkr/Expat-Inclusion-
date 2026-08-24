# Messagerie Firestore — Endpoints (US-13)

Messagerie temps réel liée à une **demande de réservation acceptée**.
Firebase = conversations / messages uniquement. Laravel reste source de vérité
pour l'ownership et l'émission du custom token.

## Flux imposé

```
1. Sanctum login (cookie)
2. POST /api/firebase/token          → custom token + allowed_conversations
3. Front : signInWithCustomToken
4. GET  /api/conversations           → inbox (demandes acceptées)
5. GET  /api/bookings/{id}/conversation → métadonnées du thread
6. Firestore : conversations/{booking_{id}}/messages
```

ID de conversation : `booking_{bookingRequest.id}`  
UID Firebase : `String(users.id)` Laravel.

---

## POST /api/firebase/token

Authentifié (`auth:sanctum`). Rate limit 30/min.

Émet un custom token Firebase. Claims :

| Claim | Contenu |
|-------|---------|
| `role` | `parent` \| `aesh` \| `admin` |
| `allowed_conversations` | liste des `booking_{id}` des demandes **accepted** de l'utilisateur |

```json
{
  "token": "eyJ...",
  "uid": "4",
  "allowed_conversations": ["booking_12"]
}
```

| Code | Cas |
|------|-----|
| 200 | Token émis |
| 401 | Non authentifié |

---

## GET /api/conversations

Inbox des threads ouverts (demandes au statut `accepted` uniquement).

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

Métadonnées d'un thread. Réservé aux participants. Demande **accepted** obligatoire.

| Code | Cas |
|------|-----|
| 200 | OK |
| 403 | Pas participant |
| 422 | Demande non acceptée |

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

Security Rules : `firebase/firestore.rules`  
→ accès si `conversationId in request.auth.token.allowed_conversations`
et `auth.uid` ∈ `participant_ids`.

---

## Frontend

- `/dashboard/parent/conversations` · `/dashboard/parent/conversations/[bookingId]`
- `/dashboard/aesh/conversations` · `/dashboard/aesh/conversations/[bookingId]`
- Lien « Ouvrir la conversation » sur les demandes acceptées
