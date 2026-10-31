# Parcours manuel QA — Cockpit admin (US-19)

Parcours de recette du support manuel : demandes, utilisateurs, suspension,
notes internes. Complète `AdminBookingTest.php` et `AdminUserTest.php`.

## Préparation de l'environnement

Identique à `US-11-US-12-parcours-manuel.md` (Docker MySQL + Mailpit,
`php artisan migrate --force && php artisan db:seed --force`,
`php artisan serve`, `npm run dev`), avec `STRIPE_PLATFORM_FEE_ENABLED=false`
dans `backend/.env`. Se connecter via `http://localhost:3000`.
Les comptes de test se créent par l'inscription ; aucun identifiant n'est versionné.

## Jeu de données

Compte admin ; un parent et un AESH avec au moins une demande entre eux.

## Parcours nominal

| # | Écran | Action | Attendu |
|---|-------|--------|---------|
| 1 | `/dashboard/admin` | Ouvrir | « À traiter » : profils à vérifier, « Demandes sans réponse » |
| 2 | `/dashboard/admin/bookings` | Ouvrir | « Liste des demandes » avec statut et participants |
| 3 | Demande | Ouvrir | « Détail de la demande », « Historique des statuts », aucune section paiement ni badge « Payé » |
| 4 | Détail | « Note interne », « Ajouter » | Note affichée avec auteur et date |
| 5 | `/dashboard/admin/users` | Filtre « Parents », « Rechercher un utilisateur » | « Liste des utilisateurs » filtrée |
| 6 | Recherche sans résultat | Rechercher un nom inexistant | « Aucun utilisateur trouvé » |
| 7 | Utilisateur | « Suspendre le compte » → « Confirmer la suspension » | Badge « Suspendu » |
| 8 | `/connexion` (compte suspendu) | Se connecter | Message « compte a été suspendu » |
| 9 | Session déjà ouverte du compte suspendu | Recharger une page | Accès coupé (`403` sur l'API) |
| 10 | Utilisateur | « Réactiver le compte » → « Confirmer la réactivation » | L'utilisateur peut se reconnecter |

## Contrôles à vérifier

| Test | Attendu |
|------|---------|
| Parent ou AESH sur `/dashboard/admin/*` | Redirection |
| `GET /api/admin/bookings` par un AESH | `403` |
| Suspendre un compte administrateur | Refusé (`422` « Impossible de suspendre un compte administrateur. ») |
| AESH suspendu | Absent de la recherche et de sa fiche publique |

## Points de vigilance métier

- Les notes internes ne sont visibles que de l'équipe.
- Pas de liste des paiements en V1 (le détail de la demande suffit).

## Résultat du dernier passage

**31 octobre 2026** — parcours écrit. Rejoué automatiquement le même jour sur la
pile locale SQLite (suite e2e Playwright + 221 tests backend, tous verts) : étapes 2–8 et 10 (spec admin « cockpit »), étape 9 et contrôles (RouteCoverageTest, AdminUserTest).
Reste à rejouer à la main par l'équipe avant la recette : étape 1 avec des données réelles.
