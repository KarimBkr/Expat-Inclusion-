# Admin — Vérification profils AESH (US-08)

Workflow admin : **pending → approved → published** ou **pending → rejected**.

> La table `aesh_profiles` est minimale en attendant l'enrichissement US-05/06 (Jihad). Les champs pro (tarif, langues, pivots) seront ajoutés via migration dédiée.

## Statuts

| Statut | Description |
|--------|-------------|
| `pending` | Soumis, en attente de review admin |
| `approved` | Vérification OK, pas encore visible publiquement |
| `rejected` | Refusé avec motif |
| `published` | Visible pour la recherche parent (US-09) |

---

## GET /api/admin/aesh-profiles

Query optionnel : `?status=pending|approved|rejected|published`

## GET /api/admin/aesh-profiles/{id}

Détail + notes internes.

## POST /api/admin/aesh-profiles/{id}/approve

Profil `pending` uniquement.

## POST /api/admin/aesh-profiles/{id}/reject

Corps : `{ "rejection_reason": "..." }` — profil `pending` uniquement.

## POST /api/admin/aesh-profiles/{id}/publish

Profil `approved` uniquement.

## POST /api/admin/aesh-profiles/{id}/notes

Corps : `{ "body": "..." }` — note interne admin (non visible des utilisateurs).

---

## Frontend

`/dashboard/admin/aesh`
