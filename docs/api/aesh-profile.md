# Profil AESH & Documents — Endpoints (US-05 & US-06)

Profil professionnel de l'AESH (bio, langues, pays, modalités, niveaux) et
pièces de candidature (CV, lettre de motivation).

> Aucun tarif n'est collecté : la rémunération se convient directement entre la
> famille et l'accompagnant, hors plateforme. Aucune pièce d'identité ni diplôme
> n'est demandé — la plateforme ne traite aucun document à portée légale.

> **Aucun document médical.** Les documents sont stockés sur le disque privé
> (`storage/app/private`) et ne sont jamais servis publiquement.

Toutes les routes exigent `auth:sanctum` + `role:aesh` (403 sinon).

---

## GET /api/taxonomies

Public. Étendu pour US-05 avec `languages` et `modalities`.

```json
{
  "countries": [{ "id": 1, "code": "FR", "name": "France", "is_aefe_network": true }],
  "specializations": [{ "id": 1, "slug": "tsa", "name": "TSA" }],
  "school_levels": [{ "id": 1, "slug": "cp", "name": "CP", "cycle": "Cycle 2", "order": 2 }],
  "languages": [{ "id": 1, "code": "fr", "name": "Français" }],
  "modalities": [{ "id": 1, "slug": "presentiel", "name": "Présentiel" }]
}
```

---

## GET /api/aesh/profile

| Code | Cas                                |
|------|------------------------------------|
| 200  | Profil existant ou `profile: null` |
| 403  | Rôle insuffisant                   |

```json
{
  "profile": {
    "id": 1,
    "bio": "Accompagnante expérimentée…",
    "experience_years": 10,
    "timezone": "Europe/Paris",
    "phone": "+33612345678",
    "verification_status": "pending",
    "is_published": false,
    "is_complete": true,
    "specialization_ids": [1, 3],
    "language_ids": [1, 2],
    "modality_ids": [1],
    "country_ids": [1, 5],
    "school_level_ids": [2]
  },
  "is_complete": true
}
```

---

## POST /api/aesh/profile

Crée le profil (une seule fois par compte).

### Corps

| Champ                | Type    | Requis | Contraintes                       |
|----------------------|---------|--------|-----------------------------------|
| `bio`                | string  | oui    | min 50, max 2000                  |
| `experience_years`   | integer | non    | 0–60                              |
| `timezone`           | string  | oui    | fuseau IANA valide                |
| `phone`              | string  | non    | max 30, format international      |
| `specialization_ids` | array   | oui    | min 1, exists:specializations     |
| `language_ids`       | array   | oui    | min 1, exists:languages           |
| `modality_ids`       | array   | oui    | min 1, exists:modalities          |
| `country_ids`        | array   | oui    | min 1, exists:countries           |
| `school_level_ids`   | array   | non    | exists:school_levels              |

| Code | Cas                  |
|------|----------------------|
| 201  | Profil créé          |
| 409  | Profil déjà existant |
| 422  | Validation échouée   |
| 403  | Rôle insuffisant     |

---

## PUT /api/aesh/profile

Met à jour le profil existant. Même corps que POST. Les relations sont
resynchronisées (`sync`) à chaque appel.

| Code | Cas                          |
|------|------------------------------|
| 200  | Profil mis à jour            |
| 404  | Aucun profil à mettre à jour |
| 422  | Validation échouée           |

### Complétion

`is_complete` = bio + fuseau + au moins une spécialisation, une
langue, une modalité et un pays. `verification_status` (pending/approved/rejected)
et `is_published` sont pilotés par l'admin (US-08).

---

## GET /api/aesh/documents

```json
{
  "documents": [
    {
      "id": 1,
      "type": "cv",
      "original_name": "diplome.pdf",
      "size": 204800,
      "status": "pending",
      "rejection_reason": null,
      "created_at": "2026-07-05T10:00:00+00:00"
    }
  ]
}
```

---

## POST /api/aesh/documents

`multipart/form-data`.

| Champ  | Type | Requis | Contraintes                                   |
|--------|------|--------|-----------------------------------------------|
| `type` | enum | oui    | `cv`, `cover_letter` |
| `file` | file | oui    | pdf/jpg/jpeg/png, max 5 Mo                     |

| Code | Cas                              |
|------|----------------------------------|
| 201  | Document envoyé (statut pending) |
| 409  | Aucun profil AESH créé au préalable |
| 422  | Fichier ou type invalide         |

---

## GET /api/aesh/documents/{document}/download

Télécharge le fichier depuis le disque privé. Réservé au propriétaire (403 sinon,
404 si le fichier n'existe plus).

---

## DELETE /api/aesh/documents/{document}

Supprime un document et son fichier.

| Code | Cas                                       |
|------|-------------------------------------------|
| 200  | Document supprimé                         |
| 403  | Pas le propriétaire, ou document déjà validé |
