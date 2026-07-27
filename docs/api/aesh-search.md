# Recherche AESH — Endpoint (US-09)

Recherche des profils AESH **publiés** avec filtres et pagination. Réservé aux
parents authentifiés.

> Seuls les profils avec `verification_status = published` sont retournés.
> Aucune donnée de contact (email, téléphone) n'est exposée dans les résultats.

Authentification : `auth:sanctum` + `role:parent` (403 sinon).

---

## GET /api/parent/aesh-search

### Query params (tous optionnels)

| Param               | Type    | Contrainte              |
|---------------------|---------|-------------------------|
| `country_id`        | integer | exists:countries        |
| `specialization_id` | integer | exists:specializations  |
| `modality_id`       | integer | exists:modalities       |
| `school_level_id`   | integer | exists:school_levels    |
| `language_id`       | integer | exists:languages        |
| `page`              | integer | min:1                   |

Un filtre invalide renvoie `422`. 12 résultats par page, triés par date de
publication décroissante.

### Réponse `200`

```json
{
  "data": [
    {
      "id": 1,
      "name": "Samira B.",
      "bio": "Accompagnante spécialisée…",
      "hourly_rate": "35.00",
      "experience_years": 8,
      "verification_status": "published",
      "specializations": [{ "id": 1, "name": "TSA" }],
      "languages": [{ "id": 1, "name": "Français" }],
      "modalities": [{ "id": 1, "name": "Présentiel" }],
      "countries": [{ "id": 1, "name": "France" }],
      "school_levels": [{ "id": 2, "name": "CP" }]
    }
  ],
  "links": { "first": "…", "last": "…", "prev": null, "next": "…" },
  "meta": { "current_page": 1, "last_page": 3, "per_page": 12, "total": 30 }
}
```

### Index SQL

Migration `add_search_indexes_to_aesh_pivots` : index sur la seconde colonne des
pivots (`country_id`, `specialization_id`, `modality_id`, `school_level_id`) pour
servir efficacement le filtrage par taxonomie.
