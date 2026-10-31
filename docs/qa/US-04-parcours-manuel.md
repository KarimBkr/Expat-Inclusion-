# Parcours manuel QA — Profil parent (US-04)

Parcours de recette du profil parent : résidence, brief enfant minimal, consentements RGPD.
Complète `ParentProfileTest.php`.

## Préparation de l'environnement

Identique à `US-11-US-12-parcours-manuel.md` (Docker MySQL + Mailpit,
`php artisan migrate --force && php artisan db:seed --force`,
`php artisan serve`, `npm run dev`), avec `STRIPE_PLATFORM_FEE_ENABLED=false`
dans `backend/.env`. Se connecter via `http://localhost:3000`.
Les comptes de test se créent par l'inscription ; aucun identifiant n'est versionné.

## Jeu de données

Un compte parent vérifié, sans profil.

## Parcours nominal

| # | Écran | Action | Attendu |
|---|-------|--------|---------|
| 1 | `/dashboard/parent` | Ouvrir | Carte « Prochaine étape » vers le profil |
| 2 | `/dashboard/parent/profil` | Ouvrir | « Mon profil parent », formulaire vide |
| 3 | Formulaire | Envoyer sans cocher les consentements | Refus, erreurs sur « conditions générales » et « traitement de mes données » |
| 4 | Formulaire | Remplir pays, ville, langues, niveau scolaire, cocher les deux consentements, « Créer mon profil » | Profil enregistré, le bouton devient « Mettre à jour mon profil » |
| 5 | Formulaire | Modifier la ville, « Mettre à jour mon profil » | Message de succès, valeur conservée au rechargement |
| 6 | `/dashboard/parent` | Revenir | La prochaine étape devient la recherche d'un AESH |

## Contrôles à vérifier

| Test | Attendu |
|------|---------|
| AESH sur `/dashboard/parent/profil` | Redirection vers son espace |
| `GET /api/parent/profile` sans session | `401` |
| Profil d'un autre parent | Inaccessible (le profil est toujours celui du compte connecté) |

## Points de vigilance métier

- Le brief enfant ne contient **aucune donnée de santé** : pas de diagnostic, pas de champ médical.
- Les consentements sont datés et obligatoires.

## Résultat du dernier passage

**31 octobre 2026** — parcours écrit. Rejoué automatiquement le même jour sur la
pile locale SQLite (suite e2e Playwright + 221 tests backend, tous verts) : étapes 1–4 (spec parent « sign-up to conversation », a11y).
Reste à rejouer à la main par l'équipe avant la recette : étapes 5–6.
