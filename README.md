# Expat Inclusion — Guide d'installation

> Guide complet pour démarrer le projet en local.  
> Stack : Next.js · Laravel · MySQL (Docker) · Firebase · Stripe

---

## Prérequis

Installe ces outils avant tout :

| Outil | Version minimale | Lien |
|-------|-----------------|------|
| Git | 2.x | https://git-scm.com |
| Docker Desktop | 4.x | https://www.docker.com/products/docker-desktop |
| PHP | 8.3+ | https://www.php.net |
| Composer | 2.x | https://getcomposer.org |
| Node.js | 20+ | https://nodejs.org |
| pnpm | 8+ | `npm install -g pnpm` |

---

## 1. Cloner le repo

```bash
git clone git@github-karimbkr:KarimBkr/Expat-Inclusion-.git
cd Expat-Inclusion-
git checkout dev
```

> ⚠️ Tu dois avoir ta clé SSH configurée sur GitHub.  
> Si tu as plusieurs clés SSH, vérifie ton `~/.ssh/config`.

---

## 2. Lancer Docker (MySQL + Mailpit)

Docker gère **la base de données MySQL et le serveur mail** en local.  
Tu n'as pas besoin d'installer MySQL sur ta machine.

```bash
# À la racine du projet (là où est docker-compose.yml)
docker compose up -d
```

Vérifie que les conteneurs tournent :

```bash
docker compose ps
```

Tu dois voir deux conteneurs avec le statut `running` :
- `mysql` — base de données MySQL 8 sur le port `3307` (host) → `3306` (conteneur)
- `mailpit` — serveur mail de dev sur le port `8025`

### Identifiants MySQL (définis dans docker-compose.yml)

| Paramètre | Valeur |
|-----------|--------|
| Host | `127.0.0.1` |
| Port | `3307` (host) |
| Base de données | `expat_inclusion` |
| Utilisateur | `expat` |
| Mot de passe | `expat` |

> Ces identifiants ne sont utilisés qu'en local. Jamais en production.

### Interface Mailpit (emails de dev)

Ouvre http://localhost:8025 dans ton navigateur.  
Tous les emails envoyés en local apparaissent ici.

---

## 3. Configurer le backend (Laravel)

```bash
cd backend
```

### 3.1 Installer les dépendances PHP

```bash
composer install
```

### 3.2 Créer le fichier .env

```bash
cp .env.example .env
```

### 3.3 Remplir le .env

Ouvre `backend/.env` et remplis ces valeurs :

```env
APP_NAME="Expat Inclusion"
APP_ENV=local
APP_KEY=                        # généré à l'étape 3.4
APP_DEBUG=true
APP_URL=http://localhost:8000

# Base de données MySQL (Docker)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3307
DB_DATABASE=expat_inclusion
DB_USERNAME=expat
DB_PASSWORD=expat

# Frontend (pour CORS)
FRONTEND_URL=http://localhost:3000

# Mail (Mailpit Docker)
MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_FROM_ADDRESS=noreply@expat-inclusion.com
MAIL_FROM_NAME="Expat Inclusion"

# Stripe (clés de test — Jihad te les donne)
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Firebase (voir section 5)
FIREBASE_CREDENTIALS=/chemin/absolu/vers/firebase-service-account.json
```

> Les clés Stripe de test sont sur https://dashboard.stripe.com/test/apikeys  
> Chacun crée son propre compte Stripe de test en local.

### 3.4 Générer la clé Laravel

```bash
php artisan key:generate
```

### 3.5 Créer les tables et peupler les taxonomies

```bash
php artisan migrate --seed
```

Tu dois voir les migrations s'exécuter sans erreur.  
Les seeders vont créer les pays, langues, spécialisations, niveaux scolaires et modalités.

### 3.6 Lancer le serveur Laravel

```bash
php artisan serve
```

L'API tourne sur http://localhost:8000  
Test rapide : http://localhost:8000/api — doit retourner `{"message":"Unauthenticated."}`

---

## 4. Configurer le frontend (Next.js)

```bash
cd ../frontend
```

### 4.1 Installer les dépendances

```bash
pnpm install
```

### 4.2 Créer le fichier .env.local

```bash
cp .env.example .env.local
```

Remplis `frontend/.env.local` :

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000

# Stripe clé publique uniquement (jamais la clé secrète ici)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Firebase config publique (depuis la console Firebase)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=expat-inclusion.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=expat-inclusion
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=expat-inclusion.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

> Pour les valeurs Firebase publiques :  
> Console Firebase → ⚙️ Paramètres → **Vos applications** → SDK Firebase

### 4.3 Lancer le frontend

```bash
pnpm dev
```

Le frontend tourne sur http://localhost:3000

---

## 5. Configurer Firebase (service account)

Le fichier `firebase-service-account.json` contient la clé privée Firebase.  
**Il ne doit jamais être commité sur GitHub.**

Jihad te l'envoie par canal sécurisé (message privé, Bitwarden, etc.).

1. Place-le dans `backend/firebase-service-account.json`
2. Dans `backend/.env`, remplis :

```env
FIREBASE_CREDENTIALS=/Users/TON_USER/Desktop/Expat-Inclusion-/backend/firebase-service-account.json
```

> Utilise le chemin absolu complet vers le fichier sur ta machine.

Test de vérification :

```bash
cd backend
php artisan tinker --execute="app(\Kreait\Firebase\Contract\Auth::class); echo 'Firebase OK';"
```

Doit afficher `Firebase OK`.

---

## 6. Vérification globale

À ce stade, tout doit fonctionner :

```bash
# Docker
docker compose ps                    # mysql + mailpit running

# Backend
curl http://localhost:8000/api       # {"message":"Unauthenticated."}

# Frontend
open http://localhost:3000           # page Next.js

# Mail
open http://localhost:8025           # interface Mailpit

# Firebase
php artisan tinker --execute="app(\Kreait\Firebase\Contract\Auth::class); echo 'OK';"
```

---

## 7. Workflow Git — Règles absolues

```
main   ← INTERDIT — ne jamais toucher
dev    ← branche d'intégration
feature/US-XX-nom  ← une branche par feature, depuis dev
```

### Démarrer une feature

```bash
git checkout dev
git pull origin dev
git checkout -b feature/US-01-landing-page
```

### Commiter

```bash
git commit -m "feat: ajouter la landing page Expat Inclusion"
```

Format : `type: description courte en français à l'impératif`  
Types : `feat` `fix` `refactor` `style` `test` `docs` `chore`

**Interdit dans les commits :**
- Co-authored-by
- Mention de Claude, IA ou tout outil
- Commits directs sur `main` ou `dev`

### Merger dans dev (après review)

```bash
git checkout dev
git merge --no-ff feature/US-01-landing-page
git push origin dev
git branch -d feature/US-01-landing-page
```

---

## 8. Ton premier sprint — US-01

Tu attaques **US-01** : landing page, FAQ, concept, mentions légales, contact.

```bash
git checkout dev && git pull origin dev
git checkout -b feature/US-01-landing-page
```

Tu livres **front + back + tests + QA** toi-même pour cette feature.  
Lis le `CLAUDE.md` à la racine pour toutes les conventions de code.

---

## 9. Structure du projet

```
Expat-Inclusion-/
├── CLAUDE.md              # Règles du projet — à lire en entier
├── docker-compose.yml     # MySQL 8 + Mailpit
├── frontend/              # Next.js App Router
│   ├── app/               # Pages et layouts
│   ├── components/        # Composants UI réutilisables
│   ├── lib/               # Utilitaires purs
│   ├── services/          # Appels API vers Laravel
│   └── types/             # Types TypeScript
└── backend/               # Laravel API
    ├── app/               # Modèles, Controllers, Services
    ├── routes/api.php     # Toutes les routes API
    ├── database/
    │   ├── migrations/    # Structure BDD
    │   └── seeders/       # Données initiales (taxonomies)
    └── config/
        ├── sanctum.php    # Auth SPA
        ├── cors.php       # CORS configuré
        └── firebase.php   # Firebase Admin SDK
```

---

## 10. Commandes utiles

```bash
# Backend
php artisan migrate:fresh --seed    # Réinitialiser la BDD
php artisan route:list              # Voir toutes les routes API
php artisan tinker                  # Console interactive Laravel
php artisan test                    # Lancer les tests PHP

# Frontend
pnpm dev                            # Démarrer en dev
pnpm build                          # Build production
pnpm lint                           # Vérifier le code (Biome)
pnpm lint:fix                       # Corriger automatiquement
pnpm typecheck                      # Vérifier les types TypeScript

# Docker
docker compose up -d                # Démarrer
docker compose down                 # Arrêter
docker compose logs mysql           # Logs MySQL
```

---

## Problèmes fréquents

**`php artisan migrate` échoue avec "Connection refused"**  
→ Docker n'est pas lancé. Faire `docker compose up -d` d'abord.

**`pnpm install` échoue avec une erreur sharp**  
→ `cd frontend && pnpm approve-builds` puis re-lancer `pnpm install`.

**`Firebase Auth OK` ne s'affiche pas**  
→ Vérifier que `FIREBASE_CREDENTIALS` pointe vers le bon chemin absolu dans `.env`.

**CORS error dans le navigateur**  
→ Vérifier que `FRONTEND_URL=http://localhost:3000` est bien dans `backend/.env`.