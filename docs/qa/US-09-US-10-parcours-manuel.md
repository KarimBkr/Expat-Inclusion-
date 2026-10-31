# Parcours manuel QA — Recherche et fiche AESH (US-09 + US-10)

Parcours de recette de la recherche parent et de la fiche AESH publiée.
Complète `AeshSearchTest.php` et `AeshDetailTest.php`.

## Préparation de l'environnement

Identique à `US-11-US-12-parcours-manuel.md` (Docker MySQL + Mailpit,
`php artisan migrate --force && php artisan db:seed --force`,
`php artisan serve`, `npm run dev`), avec `STRIPE_PLATFORM_FEE_ENABLED=false`
dans `backend/.env`. Se connecter via `http://localhost:3000`.
Les comptes de test se créent par l'inscription ; aucun identifiant n'est versionné.

## Jeu de données

Un parent avec profil ; au moins deux AESH publiés (pays et spécialités différents) et un AESH non publié.

## Parcours nominal

| # | Écran | Action | Attendu |
|---|-------|--------|---------|
| 1 | `/dashboard/parent/recherche` | Ouvrir sans filtre | Les AESH publiés, cartes avec « Voir le profil → » |
| 2 | Filtres | Filtrer par pays puis par trouble | Seuls les profils correspondants restent |
| 3 | Filtres | Combinaison sans résultat | État vide avec « Réinitialiser les filtres » |
| 4 | État vide | « Réinitialiser les filtres » | Tous les profils reviennent |
| 5 | Carte | « Voir le profil → » | `/aesh/{id}` : nom, bio, langues, modalités, badges « Profil vérifié par notre équipe », « ✓ Compétences vérifiées par entretien » |
| 6 | Fiche | Chercher un tarif, un email, un téléphone | Aucun |
| 7 | Fiche | « Envoyer une demande » | Formulaire de demande (US-11) |
| 8 | 375 px | Refaire 1–5 | Filtres et cartes utilisables, pas de défilement horizontal |

## Contrôles à vérifier

| Test | Attendu |
|------|---------|
| `/aesh/{id}` d'un AESH non publié ou suspendu | Introuvable (`404`) |
| `GET /api/aesh/search` sans session | `401` |
| AESH qui appelle la recherche | `403` |
| Filtre inconnu dans l'URL | Ignoré ou refusé proprement, pas d'erreur 500 |

## Points de vigilance métier

- Aucun montant, aucune coordonnée, aucune donnée de santé sur les cartes ou la fiche.

## Résultat du dernier passage

**31 octobre 2026** — parcours écrit. Rejoué automatiquement le même jour sur la
pile locale SQLite (suite e2e Playwright + 221 tests backend, tous verts) : étapes 1–5, 7–8 (specs parent, parent-pages, a11y), contrôles (AeshSearchTest, AeshDetailTest, RouteCoverageTest).
Reste à rejouer à la main par l'équipe avant la recette : étapes 2 et 6 sur un jeu de données réel.
