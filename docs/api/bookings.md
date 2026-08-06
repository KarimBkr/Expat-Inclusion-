# Demandes de réservation — Endpoints (US-11 + US-12)

Cycle de vie complet d'une demande entre un parent et un AESH publié.
Toutes les routes sont derrière `auth:sanctum`.

> Aucune coordonnée (email, téléphone) ne transite dans ces réponses : le parent
> et l'AESH échangent via la messagerie une fois la demande acceptée.

---

## Machine à états

```
              ┌──────────────► accepted ──────────┐
              │               (AESH)              │
  requested ──┼──────────────► declined           ├──► cancelled
   (parent)   │                (AESH)             │    (parent ou AESH)
              └──────────────────────────────────-┘
                              cancelled
                          (parent ou AESH)
```

| Depuis      | Vers                                | Déclencheur                |
|-------------|-------------------------------------|----------------------------|
| `requested` | `accepted`, `declined`              | AESH destinataire          |
| `requested` | `cancelled`                         | Parent auteur              |
| `accepted`  | `cancelled`                         | Parent auteur **ou** AESH  |
| `declined`  | — (terminal)                        | —                          |
| `cancelled` | — (terminal)                        | —                          |

Toute transition hors de ce tableau renvoie `422` sans modifier la demande.
Chaque transition écrit une ligne dans `booking_status_histories`
(`from_status`, `to_status`, `changed_by`, `reason`).

---

## GET /api/bookings

Liste les demandes de l'utilisateur courant : **envoyées** pour un parent,
**reçues** pour un AESH. Triées de la plus récente à la plus ancienne.

| Query param | Type   | Contrainte                                            |
|-------------|--------|-------------------------------------------------------|
| `status`    | string | `requested` \| `accepted` \| `declined` \| `cancelled` |

Un statut inconnu renvoie `422`.

### Réponse `200`

```json
{
  "data": [
    {
      "id": 12,
      "status": "requested",
      "status_label": "En attente de réponse",
      "is_final": false,
      "message": "Nous cherchons un accompagnement pour notre fils…",
      "start_date": "2026-09-01",
      "hours_per_week": 6,
      "hourly_rate": "35.00",
      "response_reason": null,
      "responded_at": null,
      "created_at": "2026-08-06T09:14:00+00:00",
      "modality": { "id": 1, "name": "Présentiel" },
      "school_level": { "id": 2, "name": "CP" },
      "parent": { "id": 4, "name": "Claire D." },
      "aesh": { "id": 1, "name": "Samira B." }
    }
  ]
}
```

## GET /api/bookings/{booking}

Détail d'une demande, **historique inclus** (`histories`). Accessible au parent
auteur et à l'AESH destinataire uniquement (`403` sinon).

```json
{
  "data": {
    "id": 12,
    "status": "accepted",
    "histories": [
      {
        "id": 2,
        "from_status": "requested",
        "to_status": "accepted",
        "label": "Acceptée",
        "reason": null,
        "author": { "id": 7, "name": "Samira B." },
        "created_at": "2026-08-06T10:02:00+00:00"
      }
    ]
  }
}
```

## POST /api/bookings

Crée une demande. Réservé au rôle `parent`.

| Champ             | Type    | Contrainte                          |
|-------------------|---------|-------------------------------------|
| `aesh_profile_id` | integer | `exists:aesh_profiles` **et publié** |
| `message`         | string  | 20 à 1000 caractères                |
| `modality_id`     | integer | `exists:modalities`                 |
| `school_level_id` | integer | `exists:school_levels`              |
| `start_date`      | date    | `after_or_equal:today`              |
| `hours_per_week`  | integer | 1 à 40                              |

Règles métier appliquées par `BookingRequestService` :

- le profil visé doit être **publié** — sinon `422` sur `aesh_profile_id` ;
- un parent ne peut pas avoir **deux demandes `requested`** auprès du même AESH ;
- le **tarif horaire est figé** à la création (`hourly_rate` recopié depuis le
  profil) : une révision de tarif ultérieure ne change pas le montant dû.

Réponse `201` avec la demande créée.

## POST /api/bookings/{booking}/accept

Réservé au rôle `aesh`, **destinataire** de la demande (policy `respond`).
Aucun corps de requête. `requested → accepted`.

## POST /api/bookings/{booking}/decline

Réservé au rôle `aesh`, destinataire. `requested → declined`.

| Champ    | Type   | Contrainte           |
|----------|--------|----------------------|
| `reason` | string | 5 à 500 caractères, requis |

## POST /api/bookings/{booking}/cancel

Ouvert au parent auteur **et** à l'AESH destinataire (policy `cancel`).
`requested → cancelled` ou `accepted → cancelled`.

| Champ    | Type   | Contrainte           |
|----------|--------|----------------------|
| `reason` | string | 5 à 500 caractères, requis |

---

## Erreurs

| Code  | Cas                                                                  |
|-------|----------------------------------------------------------------------|
| `401` | Non authentifié                                                       |
| `403` | Mauvais rôle, ou utilisateur non partie prenante de la demande        |
| `404` | Demande inexistante                                                   |
| `422` | Validation, règle métier, ou transition interdite par la machine à états |
