# Admin — Taxonomies CRUD (US-07)

Gestion admin des référentiels métier. Accès réservé au rôle `admin`.

## Compte admin de dev

Créé par `AdminUserSeeder` :

| Champ | Valeur |
|-------|--------|
| Email | `admin@expat-inclusion.test` |
| Mot de passe | `Password1` |

---

## Routes

Base : `/api/admin/taxonomies/{type}` — authentifié · `role:admin`

| `{type}` | Table |
|----------|-------|
| `countries` | `countries` |
| `specializations` | `specializations` |
| `languages` | `languages` |
| `school-levels` | `school_levels` |
| `modalities` | `modalities` |

### GET /api/admin/taxonomies/{type}

Liste toutes les entrées.

### POST /api/admin/taxonomies/{type}

Crée une entrée. Corps selon le type :

**countries** : `code`, `name`, `is_aefe_network`  
**specializations** / **modalities** : `slug`, `name`  
**languages** : `code`, `name`  
**school-levels** : `slug`, `name`, `cycle`, `order`

| Code | Cas |
|------|-----|
| 201 | Créé |
| 422 | Validation |
| 403 | Non admin |

### PUT /api/admin/taxonomies/{type}/{id}

Met à jour une entrée. Même corps que POST.

### DELETE /api/admin/taxonomies/{type}/{id}

| Code | Cas |
|------|-----|
| 200 | Supprimé |
| 409 | Entrée utilisée (ex. pays lié à un profil parent) |
| 403 | Non admin |
| 404 | Type ou ID inconnu |

---

## Frontend

- `/dashboard/admin` — hub admin
- `/dashboard/admin/taxonomies/{type}` — CRUD par taxonomie
