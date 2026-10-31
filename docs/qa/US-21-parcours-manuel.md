# Parcours manuel QA — Release candidate (US-21)

Contrôles avant la recette puis avant l'ouverture publique. Le déploiement
lui-même (Jalon 6) est fait par l'équipe en suivant `docs/ops/runbook.md`.

## Préparation de l'environnement

Pile locale comme `US-11-US-12-parcours-manuel.md`, puis l'environnement de
pré-production une fois déployé (Railway + Vercel).

## Smoke tests (local, puis pré-production)

| # | Contrôle | Attendu |
|---|----------|---------|
| 1 | `cd backend && php artisan test` | Tous les tests verts |
| 2 | `cd frontend && pnpm lint && pnpm typecheck && pnpm build` | Aucune erreur |
| 3 | Ouvrir `/`, `/faq`, `/contact`, `/mentions-legales` | Pages servies, aucune erreur console |
| 4 | Inscription parent → email reçu → vérification → profil | Parcours `US-02-US-03` et `US-04` verts |
| 5 | Inscription AESH → profil → documents → approbation → publication | Parcours `US-05-US-06` et `US-08` verts |
| 6 | Recherche → fiche → demande → acceptation → confirmation | Parcours `US-09-US-10` et `US-11-US-12` verts, aucune redirection Stripe |
| 7 | Conversation après acceptation | Parcours `US-13` vert sur le projet Firebase réel |
| 8 | `/robots.txt`, `/sitemap.xml` | `/dashboard` interdit, pages publiques listées |

## Contrôles à vérifier

| Test | Attendu |
|------|---------|
| 11 connexions en une minute depuis la même IP | `429` (limites dans `runbook.md`, section « Limites de débit ») |
| 6 messages de contact en une minute | `429` |
| `APP_DEBUG` en pré-production | `false` ; une erreur 500 n'affiche aucune trace |
| `STRIPE_PLATFORM_FEE_ENABLED` | `false` ; aucun mot « paiement » visible |
| Webhook Stripe sans secret configuré | Refusé |
| Sauvegarde de la base | Une sauvegarde existe et une restauration a été testée (runbook, « Sauvegardes ») |
| Supervision | Alerte reçue sur une erreur provoquée (runbook, « Supervision ») |

## Points de vigilance métier

- Ne jamais déployer depuis `main` sans validation des deux co-owners.
- Aucun compte de démonstration ni identifiant dans le dépôt.

## Résultat du dernier passage

**31 octobre 2026** — parcours écrit. Rejoué automatiquement le même jour sur la
pile locale SQLite : étapes 1–6 et 8 vertes (221 tests backend, lint, typecheck,
build, suite e2e), limites de débit de l'authentification vérifiées par `RouteCoverageTest`,
webhook sans secret refusé (`StripeWebhookTest`). Reste à l'équipe : étape 7 sur
Firebase réel, puis tout le tableau en pré-production (Jalon 6) avec sauvegarde
et supervision.
