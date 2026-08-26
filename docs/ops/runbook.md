# Runbook production (US-21)

Ce document couvre ce qui est nécessaire pour ouvrir Expat Inclusion en
production : variables d'environnement, étapes de déploiement, limites de
débit en place, sauvegardes et supervision. Il ne remplace pas les parcours
QA par feature (`docs/qa/*.md`), à rejouer sur l'environnement cible avant
ouverture.

## Ce qui n'existe pas encore

Aucun serveur de production ou de préproduction n'est provisionné à ce jour.
Seul l'environnement local (`docker-compose.yml`) existe. Avant d'ouvrir au
public, il faut au minimum :

- Un hébergement backend (Laravel + MySQL + queue) et frontend (Next.js).
- Le nom de domaine réel, avec `app.` et `api.` sur le même domaine racine
  (requis pour le cookie SPA Sanctum — voir CLAUDE.md).
- Un compte Stripe réel (clés `sk_live_...`, webhook configuré depuis le
  dashboard Stripe, pas seulement `stripe-mock` ou un compte test).
- Le secret `FIREBASE_SERVICE_ACCOUNT` ajouté aux secrets GitHub Actions du
  repo, pour que le job `deploy-firestore-rules` de la CI puisse déployer les
  Security Rules automatiquement sur push `main` (sinon, déploiement manuel
  via `firebase deploy --only firestore:rules` depuis `firebase/`).

## Variables d'environnement requises

Voir `backend/.env.example` pour la liste complète et les commentaires
associés. Points d'attention spécifiques à la production :

| Variable | Valeur attendue en production |
|----------|-------------------------------|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` — jamais `true`, sous peine d'exposer stack traces et config |
| `APP_URL` / `FRONTEND_URL` | domaines réels (`api.expat-inclusion.com` / `app.expat-inclusion.com`) |
| `SANCTUM_STATEFUL_DOMAINS` | domaine frontend réel |
| `STRIPE_SECRET` / `STRIPE_WEBHOOK_SECRET` | clés `sk_live_...` et secret du endpoint webhook configuré dans le dashboard Stripe (pas les clés test) |
| `STRIPE_PLATFORM_FEE_ENABLED` | décision produit à confirmer avant ouverture — voir `docs/api/payments.md` |
| `FIREBASE_CREDENTIALS` | chemin vers le service account réel, jamais commité |
| `QUEUE_CONNECTION` | `database` (déjà en place) — nécessite un worker actif (`php artisan queue:work`) pour les emails transactionnels (US-16) |

## Étapes de déploiement

```bash
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan event:cache
php artisan queue:restart   # applique le nouveau code aux workers déjà lancés
```

Le worker de queue (`php artisan queue:work`) doit tourner en permanence
(superviseur de processus — Supervisor, systemd, ou équivalent géré par
l'hébergeur) : sans lui, les emails transactionnels (US-16) ne partent jamais.

Frontend : `pnpm build` puis `pnpm start`, ou déploiement statique/managé selon
l'hébergeur choisi.

## Limites de débit (rate limiting)

Une limite globale de **60 requêtes/minute** (par utilisateur authentifié, ou
par IP pour les visiteurs) s'applique à toute l'API depuis
`AppServiceProvider::boot()` (`RateLimiter::for('api', ...)`) et
`bootstrap/app.php` (`$middleware->throttleApi()`).

Des limites plus strictes existent en plus sur les routes sensibles :

| Route | Limite |
|-------|--------|
| `POST /api/contact` | 5/min |
| Connexion / inscription | 6/min |
| `POST /api/bookings` | 10/min |
| `POST /api/bookings/{id}/pay` | 10/min |
| `POST /api/admin/aesh-import` | 10/min |
| Recherche AESH | 30/min |

## Sauvegardes

Aucune sauvegarde automatisée n'est en place. À minima avant ouverture :

- Sauvegarde quotidienne de la base MySQL (`mysqldump` planifié, ou solution
  managée de l'hébergeur si la BDD est hébergée chez lui).
- Firestore : les conversations/messages n'ont pas de valeur métier critique
  au sens du produit (pas de donnée réglementaire), mais un export périodique
  reste recommandé si l'hébergeur Firebase le permet nativement (Firestore
  export géré, pas de script custom nécessaire pour le MVP).

## Supervision

Aucun outil de suivi d'erreurs (type Sentry) n'est installé à ce jour. Recommandé
avant ouverture publique, a minima côté backend (exceptions non catchées) —
le endpoint `/up` (Laravel health check) existe déjà et peut être branché à un
monitoring externe simple (UptimeRobot ou équivalent).

## Checklist avant ouverture publique

```
[ ] Hébergement backend + frontend choisi et provisionné
[ ] Domaine réel configuré (api./app. même domaine racine)
[ ] APP_ENV=production, APP_DEBUG=false vérifiés
[ ] Compte Stripe réel connecté, webhook configuré depuis le dashboard
[ ] FIREBASE_SERVICE_ACCOUNT ajouté aux secrets CI (ou déploiement manuel des Security Rules confirmé)
[ ] Worker de queue actif et supervisé
[ ] Sauvegarde MySQL planifiée
[ ] Parcours QA de chaque US (docs/qa/*.md) rejoué sur l'environnement cible
[ ] Seuils minimaux du CLAUDE.md atteints (15 profils AESH publiés, 5 pays, 30 leads parents)
```
