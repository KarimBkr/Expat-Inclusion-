# Parcours manuel QA — Pages visiteur (US-01)

Parcours de recette des pages publiques : accueil, FAQ, contact, mentions légales,
en-tête et pied de page. Complète `ContactTest.php` et la suite e2e visiteur.

## Préparation de l'environnement

Identique à `US-11-US-12-parcours-manuel.md` (Docker MySQL + Mailpit,
`php artisan migrate --force && php artisan db:seed --force`,
`php artisan serve`, `npm run dev`), avec `STRIPE_PLATFORM_FEE_ENABLED=false`
dans `backend/.env`. Se connecter via `http://localhost:3000`.
Les comptes de test se créent par l'inscription ; aucun identifiant n'est versionné.

## Jeu de données

Aucun compte. Navigateur en navigation privée, puis un téléphone (ou 375 px).

## Parcours nominal

| # | Écran | Action | Attendu |
|---|-------|--------|---------|
| 1 | `/` | Ouvrir l'accueil | Concept clair, mise en relation **gratuite**, tarif convenu hors plateforme ; boutons « Je suis parent » et « Je suis AESH » |
| 2 | `/` | Cliquer « Je suis AESH » | `/inscription?role=aesh`, rôle AESH présélectionné |
| 3 | `/` | Cliquer « Je suis parent » | `/inscription`, rôle parent présélectionné |
| 4 | En-tête / pied de page | Parcourir chaque lien | FAQ, contact, mentions légales, connexion, inscription : aucune page 404 |
| 5 | `/faq` | Lire « Combien coûte la plateforme » | Réponse : gratuit, aucun paiement en ligne, tarif convenu directement avec l'AESH |
| 6 | `/contact` | Envoyer le formulaire vide | Erreurs de champ, dont « Votre nom est requis » |
| 7 | `/contact` | Remplir Nom complet, Email, Vous êtes, Objet, Message puis « Envoyer le message » | Bouton « Envoi en cours… » puis « Message envoyé ! » |
| 8 | `/mentions-legales` | Lire | Éditeur, hébergeur, données personnelles (RGPD) ; aucune promesse de paiement |
| 9 | Toutes les pages, 375 px | Faire défiler | Pas de défilement horizontal, menu utilisable au pouce |

## Contrôles à vérifier

| Test | Attendu |
|------|---------|
| 6 envois de contact en moins d'une minute | Le 6ᵉ est refusé (`429`) |
| `/robots.txt` | `/dashboard` interdit, `/aesh/` autorisé |
| `/sitemap.xml` | Uniquement les pages publiques |
| Recherche des mots paiement, payer, Stripe, tarif sur les pages publiques | Absents, sauf les phrases « gratuit / convenu hors plateforme » |

## Points de vigilance métier

- Aucun texte ne promet un paiement en ligne.
- Le formulaire de contact ne demande aucune donnée de santé.

## Résultat du dernier passage

**31 octobre 2026** — parcours écrit. Rejoué automatiquement le même jour sur la
pile locale SQLite (suite e2e Playwright + 221 tests backend, tous verts) : étapes 1–3, 5–7 et 9, robots et sitemap (spec visiteur, a11y).
Reste à rejouer à la main par l'équipe avant la recette : étapes 4 et 8 (liens et contenu des mentions légales) et le throttle de contact.
