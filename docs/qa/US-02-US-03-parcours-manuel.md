# Parcours manuel QA — Inscription, connexion et mot de passe (US-02 + US-03)

Parcours de recette de l'authentification Sanctum : inscription par rôle,
vérification email, connexion, déconnexion, mot de passe oublié. Complète `AuthTest.php`.

## Préparation de l'environnement

Identique à `US-11-US-12-parcours-manuel.md` (Docker MySQL + Mailpit,
`php artisan migrate --force && php artisan db:seed --force`,
`php artisan serve`, `npm run dev`), avec `STRIPE_PLATFORM_FEE_ENABLED=false`
dans `backend/.env`. Se connecter via `http://localhost:3000`.
Les comptes de test se créent par l'inscription ; aucun identifiant n'est versionné.

## Jeu de données

Deux adresses email jetables (une parent, une AESH). Mailpit ouvert sur `localhost:8025`.

## Parcours nominal

| # | Écran | Action | Attendu |
|---|-------|--------|---------|
| 1 | `/inscription` | Choisir « Je suis parent », remplir, « Créer mon compte » | « Création du compte… » puis écran « Vérifiez votre email » |
| 2 | Mailpit | Ouvrir l'email de vérification, cliquer le bouton | « Votre adresse email est vérifiée. » |
| 3 | `/dashboard` | Ouvrir | Redirection vers l'espace du rôle (`/dashboard/parent`) |
| 4 | Menu | Se déconnecter | Retour public ; `/dashboard/parent` redirige vers `/connexion` |
| 5 | `/connexion` | Mauvais mot de passe | « Identifiants incorrects. » |
| 6 | `/connexion` | Bons identifiants, « Se connecter » | Retour sur l'espace parent |
| 7 | `/mot-de-passe-oublie` | Saisir l'email, « Envoyer le lien » | « Email envoyé » ; email de réinitialisation dans Mailpit |
| 8 | `/reinitialiser-mot-de-passe` | Lien de l'email, nouveau mot de passe ×2 | Mot de passe changé, connexion possible avec le nouveau |
| 9 | Même lien | Le réutiliser | « Lien expiré ou invalide. Recommencez. » |
| 10 | `/inscription` | Refaire avec « Je suis AESH » | Arrivée sur `/dashboard/aesh` après vérification |

## Contrôles à vérifier

| Test | Attendu |
|------|---------|
| Inscription avec un email déjà utilisé | Erreur de champ, aucun compte créé |
| Plus de 10 connexions par minute | `429` |
| `GET /api/me` sans session | `401` |
| Compte suspendu par l'admin qui tente de se connecter | Message « compte a été suspendu », pas de session |
| Parent qui ouvre `/dashboard/admin` | Redirection vers son espace parent |

## Points de vigilance métier

- Mot de passe oublié sur un email inconnu : même message « Email de réinitialisation envoyé si ce compte existe. » (pas de fuite d'existence de compte).
- Aucun rôle admin ne peut être choisi à l'inscription.

## Résultat du dernier passage

**31 octobre 2026** — parcours écrit. Rejoué automatiquement le même jour sur la
pile locale SQLite (suite e2e Playwright + 221 tests backend, tous verts) : étapes 1–3 et 10 (specs parent et AESH, vérification par le journal des emails), compte suspendu (spec admin), redirections (spec nav).
Reste à rejouer à la main par l'équipe avant la recette : étapes 4–9 dans un vrai navigateur avec Mailpit.
