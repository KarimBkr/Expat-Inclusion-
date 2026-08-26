# Import CSV — Profils AESH (US-20)

Permet de créer des comptes AESH en masse depuis le sourcing terrain, sans
saisir chaque profil à la main. L'import **ne contourne jamais** le circuit de
vérification (US-08) : chaque profil créé entre au statut `pending`, exactement
comme un profil auto-créé par un AESH qui s'inscrit lui-même.

Authentification : `auth:sanctum` + rôle `admin`. Rate limit 10/min.

---

## POST /api/admin/aesh-import

Upload `multipart/form-data`, champ `file` (CSV, 2 Mo max).

### Format du fichier

Ligne d'en-tête obligatoire. Colonnes à listes multiples séparées par `;`
(pas par `,`, réservé au CSV lui-même).

| Colonne                | Requis | Contrainte                                      |
|-------------------------|--------|--------------------------------------------------|
| `name`                  | oui    | max 100 caractères                                |
| `email`                 | oui    | unique parmi `users`                              |
| `bio`                   | oui    | 50 à 2000 caractères                              |
| `experience_years`      | non    | entier, 0 à 60                                    |
| `timezone`               | oui    | fuseau IANA valide                                |
| `phone`                 | non    | max 30 caractères                                 |
| `specialization_slugs`  | oui    | slugs `specializations`, séparés par `;`          |
| `language_codes`        | oui    | codes `languages`, séparés par `;`                |
| `modality_slugs`        | oui    | slugs `modalities`, séparés par `;`               |
| `country_codes`         | oui    | codes `countries`, séparés par `;`                |
| `school_level_slugs`    | non    | slugs `school_levels`, séparés par `;`            |

Exemple de ligne :

```csv
name,email,bio,experience_years,timezone,phone,specialization_slugs,language_codes,modality_slugs,country_codes,school_level_slugs
Samira Benali,samira@example.com,"Accompagnante spécialisée depuis dix ans...",10,Europe/Paris,+33612345678,"tsa;tdah","fr;en","presentiel;distanciel","FR;MA",
```

### Comportement ligne par ligne

- Une ligne invalide (validation, email déjà pris, code ou slug de taxonomie
  inconnu) est **rejetée sans interrompre les suivantes** — chaque ligne est
  traitée dans sa propre transaction.
- Un doublon d'email **au sein du même fichier** est détecté : la première
  occurrence est importée, la seconde rejetée (l'`unique` se vérifie contre
  l'état réel de la base, mise à jour ligne après ligne).
- Colonnes manquantes dans l'en-tête → `422` immédiat, aucune ligne traitée.

### Compte créé

- Rôle `aesh`, mot de passe **aléatoire** (`Str::password(40)`), **jamais
  exposé** dans la réponse ni les logs.
- L'AESH initialise son accès via le circuit existant `POST /forgot-password`
  sur son email réel — pas de mécanisme d'invitation dédié tant qu'aucun email
  transactionnel spécifique (US-16) n'existe. L'événement `Registered` déclenche
  malgré tout l'email de vérification standard de Laravel.
- Profil créé avec `verification_status = pending` : reste invisible et non
  publiable tant qu'un admin ne l'a pas fait passer par
  `POST /admin/aesh-profiles/{id}/approve` puis `.../publish`.

### Réponse `200`

```json
{
  "message": "1 profil(s) importé(s), 1 ligne(s) en erreur.",
  "imported": [
    { "row": 2, "email": "samira@example.com", "user_id": 42 }
  ],
  "errors": [
    { "row": 3, "errors": ["Valeurs inconnues pour specialization_slugs : inexistant"] }
  ]
}
```

`row` est le numéro de ligne dans le fichier (l'en-tête compte pour la ligne 1,
donc la première ligne de données est la ligne 2).

### Erreurs

| Code  | Cas                                                     |
|-------|----------------------------------------------------------|
| `401` | Non authentifié                                           |
| `403` | Rôle autre qu'admin                                       |
| `422` | Fichier absent, mauvais format, ou colonnes manquantes    |

---

## Frontend

`/dashboard/admin/aesh-import` — formulaire d'upload avec tableau récapitulatif
du format attendu, puis rapport détaillé (lignes importées / lignes en erreur
avec message précis) après soumission.
