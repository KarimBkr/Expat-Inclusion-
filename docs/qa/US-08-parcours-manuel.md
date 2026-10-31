# Parcours manuel QA — Vérification des profils AESH par l'admin (US-08)

Parcours de recette du circuit **en attente → approuvé → publié** ou **rejeté**,
avec notes internes. Complète `AdminAeshVerificationTest.php`.

## Préparation de l'environnement

Identique à `US-11-US-12-parcours-manuel.md` (Docker MySQL + Mailpit,
`php artisan migrate --force && php artisan db:seed --force`,
`php artisan serve`, `npm run dev`), avec `STRIPE_PLATFORM_FEE_ENABLED=false`
dans `backend/.env`. Se connecter via `http://localhost:3000`.
Les comptes de test se créent par l'inscription ; aucun identifiant n'est versionné.

## Jeu de données

Deux candidatures AESH complètes (profil + CV + lettre), une sans document. Compte admin.

## Parcours nominal

| # | Écran | Action | Attendu |
|---|-------|--------|---------|
| 1 | `/dashboard/admin` | Ouvrir | Bloc « À traiter » : « Profils AESH à vérifier » avec le bon compteur |
| 2 | `/dashboard/admin/aesh` | Filtre « À vérifier » | « Liste des profils » avec les candidatures en attente |
| 3 | Candidature complète | Ouvrir | « Détail du profil » : CV et lettre, bouton « Ouvrir » qui télécharge le fichier |
| 4 | Détail | « Nouvelle note interne », « Ajouter » | Note visible avec auteur et date |
| 5 | Détail | « Approuver » puis « Publier le profil » | « Statut : Publié » ; email à l'AESH (US-16) |
| 6 | Candidature sans document | « Rejeter… » puis « Confirmer le rejet » sans motif | Refus : motif obligatoire |
| 7 | Idem | Saisir le motif, confirmer | « Motif : … » affiché ; l'AESH le voit dans ses documents |
| 8 | File « À vérifier » | Revenir | « Aucune candidature n'attend de vérification. » |
| 9 | Filtre « Publiés » | Ouvrir | Le profil publié y figure ; il apparaît dans la recherche parent |

## Contrôles à vérifier

| Test | Attendu |
|------|---------|
| Parent ou AESH sur `/dashboard/admin/aesh` | Redirection |
| `POST /api/admin/aesh/{id}/approve` par un AESH | `403` |
| Publier un profil non approuvé | `422` |
| Notes internes | Jamais visibles par l'AESH ni par un parent |

## Points de vigilance métier

- Seul un profil publié est cherchable et consultable par les parents.
- Le rejet explique quoi compléter, sans jargon.

## Résultat du dernier passage

**31 octobre 2026** — parcours écrit. Rejoué automatiquement le même jour sur la
pile locale SQLite (suite e2e Playwright + 221 tests backend, tous verts) : étapes 1–9 (spec admin « verification »).
Reste à rejouer à la main par l'équipe avant la recette : contrôle de l'email reçu dans Mailpit.
