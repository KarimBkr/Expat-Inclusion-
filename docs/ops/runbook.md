# Runbook production (US-21)

Ce document couvre ce qui est nécessaire pour ouvrir Expat Inclusion en
production : variables d'environnement, étapes de déploiement, limites de
débit en place, sauvegardes et supervision. Il ne remplace pas les parcours
QA par feature (`docs/qa/*.md`), à rejouer sur l'environnement cible avant
ouverture.

## Hébergement retenu

Aucun serveur de production ou de préproduction n'est provisionné à ce jour.
Seul l'environnement local (`docker-compose.yml`) existe.

**Décision (26/08/2026) : Vercel pour le frontend, Railway pour le backend
(API + MySQL + worker de queue).** C'est la combinaison la plus rapide à
mettre en place pour un MVP :

- **Vercel** détecte Next.js nativement — importer le repo, définir `frontend`
  comme *Root Directory*, aucune config supplémentaire.
- **Railway** héberge dans un seul projet les trois services nécessaires : le
  service web Laravel, une base **MySQL managée**, et un service worker
  (`php artisan queue:work`) — chacun avec *Root Directory* = `backend`.
  Render a été écarté pour cette raison précise : Render ne propose de base
  managée qu'en Postgres, pas en MySQL — il aurait fallu un troisième
  fournisseur juste pour la BDD, ce qui va à l'encontre de la simplicité
  recherchée.

**Migration vers un VPS + Forge plus tard : oui, sans souci, ce n'est pas un
aller sans retour.** Le code n'utilise aucun service propriétaire de
Railway/Vercel (pas de SDK Railway, pas de KV/Blob Vercel) — juste du Laravel,
du MySQL et du Next.js standards. Le jour où le coût ou le besoin de contrôle
le justifie : dump MySQL → import sur le VPS, redéploiement du même code sur
Forge. Pas de réécriture. Inutile de anticiper cette bascule maintenant ; à
reconsidérer seulement si le trafic ou un besoin spécifique (VPC, tuning fin)
l'exige.

Étapes restantes avant ouverture :

1. Créer les comptes Vercel et Railway (nécessite les moyens de paiement —
   à faire par vous, pas depuis cette session).
2. Importer le repo sur chaque plateforme avec le *Root Directory* indiqué
   ci-dessus.
3. Configurer les variables d'environnement (tableau ci-dessous) dans les
   dashboards respectifs.
4. Le nom de domaine réel, avec `app.` et `api.` sur le même domaine racine
   (requis pour le cookie SPA Sanctum — voir CLAUDE.md) — à pointer vers
   Vercel et Railway respectivement une fois les comptes créés.
5. Un compte Stripe réel (clés `sk_live_...`, webhook configuré depuis le
   dashboard Stripe, pas seulement `stripe-mock` ou un compte test).
6. Le secret `FIREBASE_SERVICE_ACCOUNT` ajouté aux secrets GitHub Actions du
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

## Étapes de déploiement (Railway + Vercel)

**Service web Railway** (*Root Directory* = `backend`) — commande de démarrage :

```bash
composer install --no-dev --optimize-autoloader && \
php artisan migrate --force && \
php artisan config:cache && php artisan route:cache && php artisan event:cache && \
php artisan serve --host=0.0.0.0 --port=$PORT
```

**Service worker Railway** (même repo, *Root Directory* = `backend`, service
séparé) — commande de démarrage :

```bash
php artisan queue:work --tries=3
```

Railway relance automatiquement un service qui crash — pas de Supervisor à
configurer manuellement. Sans ce service worker actif, les emails
transactionnels (US-16) ne partent jamais.

**Frontend Vercel** (*Root Directory* = `frontend`) : build (`pnpm build`) et
démarrage gérés automatiquement par Vercel, aucune commande à fournir.

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

- MySQL : Railway propose des backups automatiques sur ses bases managées —
  à activer dans les paramètres du service base de données (pas de script
  `mysqldump` custom nécessaire tant que la BDD reste chez Railway).
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
