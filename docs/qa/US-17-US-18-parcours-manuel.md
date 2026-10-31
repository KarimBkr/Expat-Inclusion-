# Parcours manuel QA — Tableaux de bord parent et AESH (US-17 + US-18)

Parcours de recette des accueils d'espace : prochaine action, demandes, messages,
notifications, statut de candidature. Mode frais désactivé : aucun paiement affiché.

## Préparation de l'environnement

Identique à `US-11-US-12-parcours-manuel.md` (Docker MySQL + Mailpit,
`php artisan migrate --force && php artisan db:seed --force`,
`php artisan serve`, `npm run dev`), avec `STRIPE_PLATFORM_FEE_ENABLED=false`
dans `backend/.env`. Se connecter via `http://localhost:3000`.
Les comptes de test se créent par l'inscription ; aucun identifiant n'est versionné.

## Jeu de données

Un parent et un AESH publié, avec une demande en attente puis acceptée entre eux.

## Parcours nominal

| # | Écran | Action | Attendu |
|---|-------|--------|---------|
| 1 | `/dashboard/parent` (parent sans profil) | Ouvrir | Une seule carte « Prochaine étape » : créer le profil |
| 2 | `/dashboard/parent` (profil fait) | Ouvrir | Prochaine étape : chercher un AESH |
| 3 | Navigation parent | Parcourir Accueil, Recherche, Demandes, Messages, Notifications, Profil | Chaque page s'ouvre ; menu « Menu » sur mobile |
| 4 | `/dashboard/parent/reservations` | Filtres « À traiter », « Refusées »… | État vide « Aucune demande dans cette catégorie » quand il n'y a rien |
| 5 | Demande acceptée | « Confirmer la mise en relation » | « Mise en relation confirmée », sans redirection ni mot « paiement » |
| 6 | `/dashboard/aesh` | Ouvrir | « Ma candidature » avec l'étape en cours, puis compteurs de demandes une fois publié |
| 7 | Navigation AESH | Parcourir Accueil, Demandes, Documents, Messages, Notifications, Profil | Chaque page s'ouvre |
| 8 | `/dashboard/aesh/demandes` | « Accepter » → « Confirmer l'acceptation » | « Demande acceptée » ; la demande passe dans « Toutes » avec « Ouvrir la conversation » |
| 9 | Demande en attente | « Refuser » sans motif puis avec motif | Motif obligatoire, puis « Demande refusée » |
| 10 | Les deux accueils | Après un nouvel événement | Badge de notifications non lues à jour |

## Contrôles à vérifier

| Test | Attendu |
|------|---------|
| `/dashboard` si `/api/me` échoue | « Impossible de récupérer votre compte » + « Réessayer » |
| Parent sur `/dashboard/admin` | Retour sur l'accueil parent |
| AESH sur `/dashboard/parent/reservations` | Redirection |

## Points de vigilance métier

- Aucun « Payé », « Paiement » ni montant tant que `STRIPE_PLATFORM_FEE_ENABLED=false`.
- Chaque liste a un état de chargement, un état vide et un état d'erreur.

## Résultat du dernier passage

**31 octobre 2026** — parcours écrit. Rejoué automatiquement le même jour sur la
pile locale SQLite (suite e2e Playwright + 221 tests backend, tous verts) : étapes 1–10 (specs parent-pages, parent-confirm, AESH, nav, states, a11y).
Reste à rejouer à la main par l'équipe avant la recette : étape 10 avec plusieurs vrais événements successifs.
