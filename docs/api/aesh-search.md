# Recherche AESH — Endpoint (US-09)

Recherche des profils AESH **publiés** avec filtres et pagination. Réservé aux
parents authentifiés.

> Seuls les profils avec `verification_status = published` sont retournés.
> Aucune donnée de contact (email, téléphone) n'est exposée dans les résultats.

Authentification : `auth:sanctum` + `role:parent` (403 sinon).

---

## GET /api/parent/aesh-search

### Query params (tous optionnels)

| Param             | Type    | Contrainte                    |
|-------------------|---------|--------------------------------|
| `country_id`      | integer | exists:countries               |
| `modality_id`     | integer | exists:modalities              |
| `school_level_id` | integer | exists:school_levels           |
| `language_id`     | integer | exists:languages               |
| `sort`            | string  | `recent` (défaut) \| `experience` |
| `page`            | integer | min:1                          |

Un filtre invalide renvoie `422`. 12 résultats par page.

> Pas de filtre par spécialisation/trouble : le trouble reste affiché comme
> étiquette sur chaque résultat (issu du profil AESH), mais ne réduit plus la
> liste — remplacé par le tri `experience`, jugé plus utile pour comparer des
> profils déjà filtrés par pays/langue/modalité.

Tri :
- `recent` (défaut) : date de publication décroissante.
- `experience` : années d'expérience décroissantes, date de publication en
  second critère pour départager les égalités. Les profils sans
  `experience_years` renseigné apparaissent en dernier.

### Réponse `200`

```json
{
  "data": [
    {
      "id": 1,
      "name": "Samira B.",
      "bio": "Accompagnante spécialisée…",
      "experience_years": 8,
      "verification_status": "published",
      "interview_verified_at": null,
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
