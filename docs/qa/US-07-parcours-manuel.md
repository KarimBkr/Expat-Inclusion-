# Parcours manuel QA — Taxonomies admin (US-07)

Parcours de recette des référentiels : spécialités, langues, niveaux, pays, modalités.
Complète `AdminTaxonomyTest.php`.

## Préparation de l'environnement

Identique à `US-11-US-12-parcours-manuel.md` (Docker MySQL + Mailpit,
`php artisan migrate --force && php artisan db:seed --force`,
`php artisan serve`, `npm run dev`), avec `STRIPE_PLATFORM_FEE_ENABLED=false`
dans `backend/.env`. Se connecter via `http://localhost:3000`.
Les comptes de test se créent par l'inscription ; aucun identifiant n'est versionné.

## Jeu de données

Le compte admin créé par `db:seed`.

## Parcours nominal

| # | Écran | Action | Attendu |
|---|-------|--------|---------|
| 1 | `/dashboard/admin` | Menu « Taxonomies » | Les cinq référentiels sont proposés |
| 2 | `/dashboard/admin/taxonomies/specializations` | Ouvrir | Titre « Spécialités », liste des entrées |
| 3 | Formulaire | Slug `dyspraxie-test`, Nom, « Ajouter » | « Entrée créée », l'entrée apparaît |
| 4 | Formulaire | Ajouter le même slug | Refus : slug déjà utilisé |
| 5 | Entrée | Modifier le nom | Nouveau nom visible, y compris dans les filtres de recherche parent |
| 6 | Entrée | « Supprimer » | Confirmation « Confirmer la suppression » / « Annuler » avant toute suppression |
| 7 | Confirmation | « Confirmer la suppression » | « Entrée supprimée » |
| 8 | Entrée utilisée par un profil AESH | Supprimer | Refus : « Impossible de supprimer : cette entrée est utilisée par des profils. » |

## Contrôles à vérifier

| Test | Attendu |
|------|---------|
| Parent ou AESH sur une page taxonomie | Redirection |
| `/dashboard/admin/taxonomies/inconnu` | Page introuvable (`404` côté API) |
| `POST /api/admin/taxonomies/...` sans session | `401` |

## Points de vigilance métier

- Une suppression ne doit jamais casser un profil existant.

## Résultat du dernier passage

**31 octobre 2026** — parcours écrit. Rejoué automatiquement le même jour sur la
pile locale SQLite (suite e2e Playwright + 221 tests backend, tous verts) : étapes 2–3, 6–7 (spec admin « import CSV and taxonomies »), contrôles (AdminTaxonomyTest).
Reste à rejouer à la main par l'équipe avant la recette : étapes 1, 4–5 et 8.
