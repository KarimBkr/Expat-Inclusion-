# Fiche AESH détaillée — Endpoint (US-10)

Consultation de la fiche complète d'un AESH **publié** par un parent
authentifié, en amont d'une demande de réservation.

> Un profil non publié (`pending`, `approved`, `rejected`) renvoie `404` et non
> `403` : l'existence d'un profil non publié ne fuite pas.
> Aucune donnée de contact (email, téléphone) n'est exposée — la mise en
> relation passe exclusivement par une demande de réservation.

Authentification : `auth:sanctum` + `role:parent` (`401` sans session, `403` pour
un autre rôle).

---

## GET /api/parent/aesh-profiles/{id}

`id` doit être numérique (contrainte `whereNumber`).

### Réponse `200`

```json
{
  "data": {
    "id": 1,
    "name": "Samira Benali",
    "bio": "Accompagnante spécialisée TSA avec dix ans de terrain en réseau AEFE.",
    "hourly_rate": "35.00",
    "experience_years": 10,
    "timezone": "Europe/Paris",
    "verification_status": "published",
    "published_at": "2026-07-20T10:12:00+00:00",
    "documents_verified": true,
    "specializations": [{ "id": 1, "name": "TSA" }],
    "languages": [{ "id": 1, "name": "Français" }],
    "modalities": [{ "id": 1, "name": "Présentiel" }],
    "countries": [{ "id": 1, "name": "France" }],
    "school_levels": [{ "id": 2, "name": "CP" }]
  }
}
```

### Badges de vérification

| Champ                 | Signification                                              |
|-----------------------|------------------------------------------------------------|
| `verification_status` | Toujours `published` sur cet endpoint — profil validé admin |
| `documents_verified`  | `true` si au moins un document a le statut `approved`       |
| `published_at`        | Date de publication par l'admin (US-08)                     |

### Erreurs

| Code  | Cas                                                     |
|-------|---------------------------------------------------------|
| `401` | Non authentifié                                          |
| `403` | Rôle AESH ou admin                                       |
| `404` | Profil inexistant **ou** non publié                      |
