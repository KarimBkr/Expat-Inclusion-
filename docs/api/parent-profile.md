# Profil Parent — Endpoints (US-04)

CRUD du profil parent : informations de résidence, brief enfant minimal et consentements RGPD.

> Aucun document médical. Données limitées au minimum nécessaire à la mise en relation.

---

## GET /api/taxonomies

Public. Listes de référence pour les formulaires.

```json
{
  "countries": [{ "id": 1, "code": "FR", "name": "France", "is_aefe_network": true }],
  "specializations": [{ "id": 1, "slug": "tsa", "name": "Trouble du Spectre de l'Autisme (TSA)" }],
  "school_levels": [{ "id": 1, "slug": "cp", "name": "CP", "cycle": "Cycle 2", "order": 2 }]
}
```

---

## GET /api/parent/profile

Authentifié · `role:parent`.

| Code | Cas                              |
|------|----------------------------------|
| 200  | Profil existant ou `profile: null` |
| 403  | Rôle insuffisant                 |

```json
{
  "profile": {
    "id": 1,
    "country_id": 1,
    "timezone": "Europe/Paris",
    "phone": "+33612345678",
    "child_first_name": "Lucas",
    "school_level_id": 2,
    "specialization_id": 1,
    "child_brief": "Besoin d'accompagnement en lecture.",
    "consent_terms": true,
    "consent_data_processing": true,
    "consent_marketing": false,
    "consented_at": "2026-06-28T10:00:00+00:00",
    "is_complete": true,
    "country": { "id": 1, "code": "FR", "name": "France" },
    "school_level": { "id": 2, "slug": "cp", "name": "CP" },
    "specialization": { "id": 1, "slug": "tsa", "name": "TSA" }
  },
  "is_complete": true
}
```

---

## POST /api/parent/profile

Authentifié · `role:parent`. Crée le profil (une seule fois par compte).

### Corps

| Champ                     | Type    | Requis | Contraintes                    |
|---------------------------|---------|--------|--------------------------------|
| `country_id`              | integer | oui    | exists:countries               |
| `timezone`                | string  | oui    | fuseau IANA valide             |
| `phone`                   | string  | non    | max 30, format international   |
| `child_first_name`        | string  | oui    | max 50                         |
| `school_level_id`         | integer | oui    | exists:school_levels           |
| `specialization_id`       | integer | oui    | exists:specializations         |
| `child_brief`             | string  | non    | max 500                        |
| `consent_terms`           | boolean | oui    | doit être `true`               |
| `consent_data_processing` | boolean | oui    | doit être `true`               |
| `consent_marketing`       | boolean | non    | défaut `false`                 |

| Code | Cas                    |
|------|------------------------|
| 201  | Profil créé            |
| 409  | Profil déjà existant   |
| 422  | Validation échouée     |
| 403  | Rôle insuffisant       |

---

## PUT /api/parent/profile

Authentifié · `role:parent`. Met à jour le profil existant. Même corps que POST.

| Code | Cas                    |
|------|------------------------|
| 200  | Profil mis à jour      |
| 404  | Aucun profil à mettre à jour |
| 422  | Validation échouée     |
| 403  | Rôle insuffisant       |

---

## Complétion du profil

`is_complete` est `true` lorsque tous les champs requis sont renseignés et que les consentements obligatoires sont acceptés.
