# Parcours manuel QA — Profil AESH et documents (US-05 + US-06)

Parcours de recette de la candidature AESH : profil professionnel, CV et lettre,
statut de vérification. Complète `AeshProfileTest.php` et `AeshDocumentTest.php`.

## Préparation de l'environnement

Identique à `US-11-US-12-parcours-manuel.md` (Docker MySQL + Mailpit,
`php artisan migrate --force && php artisan db:seed --force`,
`php artisan serve`, `npm run dev`), avec `STRIPE_PLATFORM_FEE_ENABLED=false`
dans `backend/.env`. Se connecter via `http://localhost:3000`.
Les comptes de test se créent par l'inscription ; aucun identifiant n'est versionné.

## Jeu de données

Un compte AESH vérifié, sans profil. Un CV et une lettre de motivation (PDF, DOC ou DOCX, 5 Mo maximum).

## Parcours nominal

| # | Écran | Action | Attendu |
|---|-------|--------|---------|
| 1 | `/dashboard/aesh` | Ouvrir | « Ma candidature » : « Email vérifié » coché, « Prochaine étape » = « Créer mon profil » |
| 2 | `/dashboard/aesh/profil` | Envoyer le formulaire avec une bio de moins de 50 caractères | Erreur de champ sur la bio |
| 3 | Formulaire | Bio complète, langues, pays, modalités, niveaux, spécialités, « Créer mon profil » | Lien « Étape suivante : envoyer mon CV et ma lettre » |
| 4 | `/dashboard/aesh/documents` | Ouvrir | « Aucun document envoyé pour le moment » |
| 5 | Documents | Envoyer le CV puis la lettre (« Envoyer le document ») | Les deux apparaissent ; « votre candidature est en cours de vérification » |
| 6 | Documents | Envoyer un fichier `.exe` ou > 5 Mo | Refus : « Le fichier doit être au format PDF, DOC ou DOCX. » ou taille maximale |
| 7 | `/dashboard/aesh` | Revenir | « Candidature en cours de vérification » |
| 8 | Après approbation admin (US-08) | Revenir | Statut mis à jour, email reçu |

## Contrôles à vérifier

| Test | Attendu |
|------|---------|
| AESH B télécharge un document d'AESH A (URL directe) | `403` |
| AESH B supprime un document d'AESH A | `403` |
| Parent sur `/dashboard/aesh/documents` | Redirection |
| Fiche publique `/aesh/{id}` | Aucun document, aucun email, aucun téléphone, aucun tarif |

## Points de vigilance métier

- Le tarif n'est ni affiché ni exposé par l'API publique (mise en relation gratuite).
- Les documents ne sont lisibles que par l'AESH et l'admin.

## Résultat du dernier passage

**31 octobre 2026** — parcours écrit. Rejoué automatiquement le même jour sur la
pile locale SQLite (suite e2e Playwright + 221 tests backend, tous verts) : étapes 1, 3–5 et 7 (spec AESH « onboarding »), contrôles d'accès (RouteCoverageTest, AeshDocumentTest).
Reste à rejouer à la main par l'équipe avant la recette : étapes 2, 6 et 8.
