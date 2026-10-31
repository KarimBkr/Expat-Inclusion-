# Guide de test — Expat Inclusion V1 (sans paiement)

Ce guide permet de lancer l'application en local et de la tester à la main, rôle par rôle.
L'installation complète (Docker, Firebase, Stripe) est décrite dans `README.md` ; les parcours
détaillés par user story sont dans `docs/qa/`.

## 1. Lancer l'application

Prérequis : PHP 8.3+, Composer, Node 20+, pnpm. Docker est optionnel.

### Backend (Laravel) — au choix

**Option A : SQLite (le plus rapide, sans Docker)**

```bash
cd backend
composer install
cp .env.example .env
touch database/database.sqlite
```

Dans `backend/.env` :

```env
DB_CONNECTION=sqlite
DB_DATABASE=/chemin/absolu/vers/backend/database/database.sqlite
MAIL_MAILER=log                     # les emails (vérification, réinitialisation) vont dans storage/logs/laravel.log
QUEUE_CONNECTION=sync
STRIPE_PLATFORM_FEE_ENABLED=false   # V1 : aucun paiement
FRONTEND_URL=http://localhost:3000
```

**Option B : MySQL + Mailpit (Docker)** : `docker compose up -d` à la racine, puis la
configuration de `README.md` §3.3 (MySQL sur le port 3307, emails visibles sur http://localhost:8025).

Puis, dans les deux cas :

```bash
php artisan key:generate
php artisan migrate --seed          # tables + référentiels (pays, langues, spécialités, niveaux, modalités) + compte admin local
php artisan storage:link
php artisan serve                   # API sur http://localhost:8000
```

### Frontend (Next.js)

```bash
cd frontend
pnpm install
cp .env.example .env.local          # NEXT_PUBLIC_API_URL=http://localhost:8000, NEXT_PUBLIC_APP_URL=http://localhost:3000
pnpm dev                            # http://localhost:3000
```

La messagerie (conversations parent ↔ AESH) utilise Firebase : sans configuration Firebase
(`README.md` §5), tout le reste fonctionne, mais les conversations ne s'ouvrent pas.

## 2. Créer les comptes de test

Aucun identifiant n'est versionné dans la documentation. Créez vos comptes vous-même :

- **Parent** et **AESH** : http://localhost:3000/inscription, choisir le rôle. Valider l'email
  avec le lien reçu (Mailpit, ou `backend/storage/logs/laravel.log` avec `MAIL_MAILER=log`).
- **Admin** : `php artisan migrate --seed` crée un compte admin local
  (`admin@expat-inclusion.test`, mot de passe défini dans `backend/database/seeders/AdminUserSeeder.php`).
  Ce compte est réservé au développement : ne jamais exécuter ce seeder en production sans changer le mot de passe.
- Pour qu'un parent trouve un AESH, l'AESH doit créer son profil et envoyer ses documents,
  puis l'admin doit l'approuver (US-08).

## 3. Tests à faire à la main

Cochez chaque point ; le détail de chaque étape est dans le fichier `docs/qa/` indiqué.

### Visiteur
- [ ] Accueil, FAQ, mentions légales et contact s'affichent sur mobile (375 px) sans défilement horizontal.
- [ ] Le formulaire de contact refuse un email invalide, puis envoie le message (`US-01`).
- [ ] Aucune mention de paiement ou de prix n'apparaît (V1 sans paiement).

### Parent
- [ ] Inscription, vérification de l'email, connexion, déconnexion, mot de passe oublié (`US-01`, `US-02-03`).
- [ ] Profil parent (`US-04`).
- [ ] Recherche d'AESH par pays, langue, modalité, niveau et type de trouble (`US-09-10`).
- [ ] Fiche AESH (`/aesh/{id}`) : badges de vérification, aucun téléphone ni email ; un profil non publié donne 404.
- [ ] Demande de mise en relation : seules les modalités et niveaux de l'AESH sont proposés (`US-11-12`).
- [ ] Tableau de bord, suivi des demandes, annulation, notifications (`US-17-18`, `US-16`).
- [ ] Conversation avec l'AESH après acceptation (Firebase requis, `US-13`).

### AESH
- [ ] Inscription, « Ma candidature » indique la prochaine étape (`US-05-06`).
- [ ] Profil : bio de moins de 50 caractères refusée, puis profil complet enregistré.
- [ ] Envoi du CV et de la lettre (PDF/DOC/DOCX, 5 Mo max) ; un `.exe` est refusé.
- [ ] Après approbation : demandes reçues, acceptation/refus, notifications (`US-17-18`, `US-16`).

### Admin
- [ ] Cockpit : compteurs et badge « En attente » (`US-19`).
- [ ] Vérification d'une candidature AESH : approbation et refus avec motif (`US-08`).
- [ ] Référentiels : ajout, doublon refusé, modification, suppression avec confirmation ; refus si l'entrée est utilisée (`US-07`).
- [ ] Import CSV d'AESH : aperçu, erreurs par ligne, import (`US-20`).
- [ ] Liste des utilisateurs et des demandes ; aucun libellé « Payé » quand les frais sont désactivés (`US-14-15`, mode frais désactivé).

### Transverse
- [ ] Chaque page clé au clavier seul (Tab, Entrée) : focus visible, boutons d'au moins 44 px sur mobile.
- [ ] Un parent ne peut pas ouvrir une URL admin ou AESH (redirection ou refus).

## 4. Tests automatisés

```bash
cd backend && php artisan test      # tests PHPUnit (API, règles, sécurité)
cd frontend && pnpm lint && pnpm typecheck && pnpm build
```
