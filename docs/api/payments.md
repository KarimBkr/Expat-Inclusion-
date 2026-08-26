# Paiement — Frais de mise en relation (US-14 + US-15)

Le parent paie un **frais de mise en relation fixe** à Expat Inclusion,
une fois, quand la demande a été acceptée par l'AESH. Ce n'est pas un tarif
AESH : l'argent ne transite jamais vers l'AESH via la plateforme — rémunération
convenue directement entre les deux parties, hors plateforme, comme depuis le
retrait du tarif horaire.

Décisions figées du projet respectées : pas de Stripe Connect, pas de
reversement automatique, pas d'abonnement. Stripe Checkout en mode `payment`,
one-shot.

## Machine à états — l'ajout de `confirmed`

```
accepted ──┬──► cancelled (terminal)
           └──► confirmed (terminal)
```

`confirmed` n'est atteint que par le webhook (US-15) — aucune action
utilisateur ne peut le déclencher, `BookingRequestPolicy` n'expose aucune
capacité en ce sens. **Terminal** : annuler une demande déjà payée impliquerait
un remboursement, hors périmètre de cette version. Une demande payée qui doit
être annulée se traite pour l'instant manuellement (tableau de bord Stripe +
mise à jour manuelle en base), pas via l'application.

## Flux

```
1. Demande acceptée (US-12)
2. POST /api/bookings/{id}/pay          → session Stripe Checkout
3. Redirection vers checkout_url (Stripe, hébergé)
4. Client paie sur Stripe
5. Stripe redirige vers success_url ou cancel_url (affichage seulement)
6. Stripe POST /api/stripe/webhook       → confirmation réelle (US-15)
   → payment.status = paid, booking.status = confirmed
```

Le webhook est la **seule** source de vérité sur la réussite du paiement — pas
la redirection `success_url`, que Stripe peut déclencher avant même que le
webhook soit reçu et traité. La page de succès du front relit le statut réel
de la demande plutôt que de supposer la confirmation.

---

## POST /api/bookings/{booking}/pay

Réservé au parent auteur (policy `pay`). Rate limit 10/min.

| Cas | Code |
|-----|------|
| Demande non `accepted` | `422` |
| Demande déjà payée (`payments.status = paid` existant) | `422` |
| Paiement `pending` déjà existant mais abandonné | Autorisé — nouvelle session créée |
| Non-auteur (AESH, autre parent) | `403` |
| Non authentifié | `401` |

### Réponse `201`

```json
{ "checkout_url": "https://checkout.stripe.com/c/pay/cs_..." }
```

Le front redirige immédiatement vers cette URL (`window.location.href`) — pas
d'intégration Stripe Elements, pas de formulaire de carte dans l'application.
Si le frais est désactivé (voir plus bas), `checkout_url` pointe directement
vers la page de succès interne plutôt que vers Stripe.

### Montant

`config('services.stripe.platform_fee_amount')`, en centimes — **jamais** lu
depuis un profil AESH ou une demande (aucune colonne de tarif n'existe plus
sur `booking_requests` depuis son retrait). Ajustable via la variable
d'environnement `STRIPE_PLATFORM_FEE_AMOUNT`, sans changement de code —
décision commerciale de la cliente, changeante par nature.

### Interrupteur `STRIPE_PLATFORM_FEE_ENABLED`

Le frais peut être désactivé sans changement de code via
`STRIPE_PLATFORM_FEE_ENABLED=false` (config `services.stripe.platform_fee_enabled`,
défaut `true`).

Quand il est désactivé, `POST /api/bookings/{booking}/pay` ne crée **aucune**
session Stripe : une ligne `payments` est enregistrée directement avec
`amount = 0`, `status = paid` et un identifiant synthétique
(`free_{uuid}`, jamais un vrai `cs_...` Stripe), et la demande passe
immédiatement à `confirmed`. Les mêmes garde-fous s'appliquent (demande
`accepted` requise, pas de double confirmation). Réactivable à tout moment en
repassant la variable à `true` — aucune migration ni changement de code
nécessaire.

Les tests automatisés forcent `STRIPE_PLATFORM_FEE_ENABLED=true` par défaut
(`phpunit.xml`) pour garder le parcours payant déterministe ; le parcours sans
frais est testé en surchargeant explicitement cette config
(`PaymentTest::test_frais_desactive_*`).

---

## POST /api/stripe/webhook

Public — aucune session Sanctum possible, Stripe appelle serveur à serveur.
La légitimité de l'appel est garantie par la signature HMAC du corps de la
requête (en-tête `Stripe-Signature`), vérifiée avec `STRIPE_WEBHOOK_SECRET`.

Traite `checkout.session.completed` ; tout autre type d'événement est reconnu
avec un `200` sans effet (répondre par une erreur inviterait Stripe à
réessayer indéfiniment un événement qu'on ne gère simplement pas).

| Cas | Code | Effet |
|-----|------|-------|
| Signature invalide | `400` | Aucun |
| Événement valide, session connue, jamais confirmée | `200` | `payment` → `paid`, `booking` → `confirmed`, historique écrit avec `changed_by = null` |
| Événement rejoué sur un paiement déjà `paid` | `200` | Aucun — idempotent |
| Session inconnue (jamais créée par `/pay`) | `200` | Aucun, pas d'erreur |
| Booking qui n'est plus `accepted` au moment du webhook | `200` | Paiement quand même marqué `paid` ; **pas** de transition forcée |

Le dernier cas mérite une note : si une demande a été annulée entre la
création de la session Checkout et la confirmation du paiement (fenêtre
courte mais réelle), le paiement Stripe a eu lieu — on ne le nie pas côté
`payments` — mais on ne force pas `booking.status` vers `confirmed` en
contradiction avec une annulation déjà enregistrée. Ce cas de bord n'a pas de
remboursement automatique associé ; à traiter manuellement s'il se présente.

---

## Table `payments`

| Colonne | Contenu |
|---------|---------|
| `booking_request_id` | FK vers la demande |
| `stripe_checkout_session_id` | Unique — clé d'idempotence du webhook |
| `stripe_payment_intent_id` | Renseigné à la confirmation |
| `amount` | Centimes, figé à la création de la session |
| `currency` | `eur` par défaut |
| `status` | `pending` \| `paid` \| `failed` |
| `paid_at` | Renseigné à la confirmation |

Un booking peut avoir plusieurs lignes `payments` (sessions abandonnées puis
retentées) ; au plus une doit être `paid`.

---

## Frontend

- `/dashboard/parent/reservations` — bouton « Confirmer la réservation » sur
  toute demande `accepted`, libellé neutre car identique que le frais soit
  actif (redirection Stripe) ou désactivé (confirmation immédiate).
- `/dashboard/parent/paiement/succes?booking={id}` — relit le statut réel
  (une nouvelle tentative après 3 s si le webhook n'est pas encore passé),
  n'affiche jamais "confirmé" sans l'avoir vérifié.
- `/dashboard/parent/paiement/annule?booking={id}` — abandon côté Stripe,
  aucun paiement effectué, retour possible à tout moment.

---

## Configuration requise

| Variable | Rôle |
|----------|------|
| `STRIPE_KEY` | Clé publique (jamais utilisée côté backend, prévue pour un futur besoin front) |
| `STRIPE_SECRET` | Clé secrète — appels API Stripe |
| `STRIPE_WEBHOOK_SECRET` | Vérification de signature du webhook |
| `STRIPE_PLATFORM_FEE_AMOUNT` | Montant du frais, en centimes (défaut 2000 = 20 €) |
| `STRIPE_CURRENCY` | Défaut `eur` |

**Aucune clé de test Stripe réelle n'était disponible au moment de ce
développement.** Deux niveaux de vérification ont été faits sans elle :

1. Tests automatisés — création de session (SDK Stripe stubbé au seul point
   de contact réseau) et webhook (signature calculée localement avec le même
   algorithme que Stripe, sans mock).
2. **Vérification réelle contre `stripe-mock`** — le serveur de simulation
   officiel de Stripe (`brew install stripe-mock`), qui valide les requêtes
   contre la vraie spec OpenAPI Stripe. `PaymentService::createCheckoutSession()`
   a tourné sans aucune modification, juste avec `StripeClient` pointé sur
   `http://localhost:12111` au lieu de `api.stripe.com` : session créée,
   réponse parsée, garde-fou anti-double-paiement, confirmation webhook de
   bout en bout — tout validé. Voir `docs/qa/US-14-US-15-parcours-manuel.md`
   pour rejouer ce test.

Ce que `stripe-mock` ne peut **pas** prouver, et qui reste à faire avec un
vrai compte Stripe test avant mise en production : qu'une carte de test
(`4242 4242 4242 4242`) va bien au bout d'un paiement réel sur la page
Checkout hébergée, et qu'un webhook envoyé par les serveurs Stripe (pas
fabriqué localement) est bien reçu et traité en conditions réelles
(`stripe listen`, `stripe trigger checkout.session.completed`).
