# Parcours manuel QA — Paiement Stripe (US-14 + US-15)

Parcours de recette à rejouer avant chaque merge touchant le paiement.
Complète les 16 tests API de `backend/tests/Feature/PaymentTest.php` et
`backend/tests/Feature/StripeWebhookTest.php`.

> ⚠️ **Aucune clé Stripe de test (compte réel) n'était disponible au moment du
> développement.** Vérifié à la place avec `stripe-mock` (voir section
> dédiée ci-dessous) : le code tourne sans modification contre le serveur de
> simulation officiel Stripe, qui valide les requêtes contre la vraie spec
> OpenAPI. Ce qui reste à faire avec un vrai compte test avant mise en
> production : qu'une carte de test aboutisse réellement sur la page Checkout
> hébergée, et qu'un webhook envoyé par les serveurs Stripe (pas fabriqué
> localement) soit bien reçu. Ce parcours ci-dessous suppose des clés test
> (`sk_test_...`) et le CLI Stripe disponibles pour cette dernière étape.

## Préparation de l'environnement

```bash
orb start
docker compose up -d
cd backend
php artisan migrate --force
php artisan db:seed --force
# Renseigner dans .env : STRIPE_KEY, STRIPE_SECRET (clés test Stripe)
php artisan serve

# Terminal séparé — écoute les webhooks Stripe et les relaie en local
stripe listen --forward-to localhost:8000/api/stripe/webhook
# Copier le whsec_... affiché dans STRIPE_WEBHOOK_SECRET (.env), relancer serve

cd ../frontend && npm run dev
```

## Vérification sans compte Stripe — `stripe-mock`

Reproductible par n'importe qui, sans compte ni clé réelle :

```bash
brew install stripe-mock
/opt/homebrew/opt/stripe-mock/bin/stripe-mock -http-port 12111 &
```

Puis, dans un script PHP bootstrapant Laravel (voir l'historique de session
pour un exemple complet), remplacer l'injection de `StripeClient` par une
instance pointée sur le mock avant d'appeler `PaymentService` normalement :

```php
$stripe = new \Stripe\StripeClient([
    'api_key' => 'sk_test_fake',
    'api_base' => 'http://localhost:12111',
]);
$app->instance(\Stripe\StripeClient::class, $stripe);
```

`createCheckoutSession()` tourne alors sans aucune modification de code contre
un serveur qui valide réellement le payload selon la spec Stripe. C'est ce qui
a été fait le 26 août 2026 : session créée et parsée, garde-fou anti-double-
paiement, confirmation webhook de bout en bout — tout validé. Ne remplace pas
un test avec un vrai compte (carte réelle, webhook envoyé par Stripe), mais
élimine le risque d'un payload mal formé ou d'un parsing de réponse incorrect.

## Jeu de données

Une demande de réservation au statut **accepted** (US-11/US-12) : parent et
AESH inscrits, profil AESH publié, demande créée puis acceptée.

## Parcours nominal

| # | Écran | Action | Attendu |
|---|-------|--------|---------|
| 1 | `/dashboard/parent/reservations` | Demande **acceptée** | Bouton « Confirmer la réservation » visible |
| 2 | Cliquer sur le bouton | Redirection | Page Stripe Checkout hébergée, montant conforme à `STRIPE_PLATFORM_FEE_AMOUNT` |
| 3 | Checkout Stripe | Payer avec la carte test `4242 4242 4242 4242` | Redirection vers `/dashboard/parent/paiement/succes` |
| 4 | Page succès | Attendre | Bascule de « en cours de confirmation » à « Paiement confirmé » dès que le webhook (terminal `stripe listen`) est traité |
| 5 | `/dashboard/parent/reservations` | Filtrer par « Confirmées » | La demande apparaît, badge plein (couleur primaire) |
| 6 | Fiche demande | Consulter | Bouton payer disparu ; bouton annuler disparu (`is_final`) |
| 7 | Historique de la demande | Ouvrir | Mouvement `accepted → confirmed`, **sans auteur** (acteur système) |
| 8 | Re-tenter un paiement sur la même demande | `POST /api/bookings/{id}/pay` | `422` — déjà payée |

## Parcours d'abandon

| # | Action | Attendu |
|---|--------|---------|
| 1 | Lancer un paiement, fermer l'onglet Stripe sans payer / cliquer "back" | Redirection vers `/dashboard/parent/paiement/annule` |
| 2 | Retour sur `/dashboard/parent/reservations` | Demande toujours `accepted`, bouton payer toujours présent |
| 3 | Relancer le paiement | Nouvelle session créée normalement (le paiement abandonné n'en bloque pas un nouveau) |

## Contrôles à vérifier avec le CLI Stripe

```bash
stripe trigger checkout.session.completed
```

| Test | Attendu |
|------|---------|
| Webhook avec signature altérée (modifier l'en-tête à la main via un client HTTP) | `400`, rien en base ne change |
| Rejouer deux fois le même événement (`stripe events resend <id>`) | Deuxième appel sans effet — `paid_at` et `payment_intent` inchangés |
| AESH tente `POST /api/bookings/{id}/pay` | `403` |
| Un autre parent tente de payer la demande | `403` |
| `POST /api/bookings/{id}/pay` sur une demande `requested`, `declined` ou `cancelled` | `422` |

## Parcours frais désactivé (`STRIPE_PLATFORM_FEE_ENABLED=false`)

Interrupteur de configuration, réversible sans changement de code.

| # | Écran | Action | Attendu |
|---|-------|--------|---------|
| 1 | `.env` | `STRIPE_PLATFORM_FEE_ENABLED=false`, relancer `serve` | — |
| 2 | `/dashboard/parent/reservations` | Demande **acceptée**, cliquer « Confirmer la réservation » | Aucune redirection Stripe — retour direct sur `/dashboard/parent/paiement/succes`, statut déjà `confirmed` |
| 3 | Base de données | Consulter `payments` | Ligne `amount = 0`, `status = paid`, `stripe_checkout_session_id` préfixé `free_` (pas un identifiant Stripe) |
| 4 | Re-tenter un paiement sur la même demande | `POST /api/bookings/{id}/pay` | `422` — déjà payée, même garde-fou qu'en mode payant |
| 5 | `.env` | Repasser à `true`, relancer `serve` | Parcours payant normal restauré sans rien d'autre à changer |

Couvert par `PaymentTest::test_frais_desactive_confirme_directement_sans_stripe`
et `test_frais_desactive_refuse_si_deja_paye`.

## Points de vigilance métier

- **Le webhook est la seule source de vérité.** Ne jamais faire confiance à
  `success_url` seule pour marquer quoi que ce soit côté serveur — Stripe peut
  rediriger le navigateur avant que le webhook soit traité. La page succès du
  front revérifie déjà le statut réel ; ne pas la simplifier en un message
  statique.
- **Aucun remboursement automatique.** `confirmed` est terminal. Une demande
  payée qui doit être annulée se gère aujourd'hui manuellement (tableau de
  bord Stripe + mise à jour en base) — pas de bouton dans l'application.
- **Le montant ne dépend d'aucun profil AESH.** Toujours lu depuis
  `config('services.stripe.platform_fee_amount')`. Si un futur besoin de
  montant variable apparaît, ce n'est pas une simple modification de config —
  cela réouvre la question du modèle économique, à trancher avec la cliente.
- **`changed_by` nullable** sur `booking_status_histories` depuis cette US —
  vérifier qu'aucun code futur ne suppose `changed_by` toujours renseigné
  (ex. un rapport qui ferait un join non préparé au null).

## Résultat du dernier passage

Développé et testé le 26 août 2026 : 166 tests backend verts, typecheck/lint/
build front verts, migration vérifiée sur MySQL réel (schéma
`booking_requests.status`, `booking_status_histories`, table `payments`
conformes). Inclut le parcours frais désactivé (ci-dessus).

Vérifié en plus contre `stripe-mock` (voir section dédiée) : création de
session réelle acceptée par un serveur qui valide selon la spec Stripe,
réponse correctement parsée, garde-fou anti-double-paiement, confirmation
webhook de bout en bout — sans aucune modification du code de production,
seul `StripeClient` était pointé sur le mock le temps du test.

**Reste à faire avant mise en production**, avec un vrai compte Stripe test :
le parcours complet ci-dessus (carte de test sur la page Checkout hébergée,
webhook envoyé par les serveurs Stripe et non fabriqué localement).
