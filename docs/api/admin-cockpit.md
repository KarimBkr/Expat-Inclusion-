# Cockpit admin (US-19)

Visibilité transverse pour le support manuel MVP (CLAUDE.md : « produit utilisable
en exploitation manuelle MVP, pas de backoffice CRM complexe »). Deux volets,
en plus de la vérification AESH déjà livrée (`docs/api/admin-aesh-verification.md`) :
réservations et utilisateurs.

## Réservations

L'admin consulte toutes les demandes, tous parents/AESH confondus — elle ne
remplace jamais les actions du state machine existant (US-12) : accepter,
refuser, annuler restent exclusivement au parent auteur ou à l'AESH
destinataire (`BookingRequestPolicy`).

### GET /api/admin/bookings

Query optionnel : `?status=requested|accepted|declined|cancelled|confirmed`.

### GET /api/admin/bookings/{id}

Détail complet : parent, AESH, modalité, niveau scolaire, paiements,
historique de statut, notes internes. `payments_enabled` (booléen, reflète
`STRIPE_PLATFORM_FEE_ENABLED`) : à `false`, le frontend masque le badge « Payé »
et la section « Paiement ».

> Pas de liste admin des paiements : le détail d'une demande suffit tant que
> les frais de mise en relation sont désactivés (décision jalons-v1, Jalon 3).

### POST /api/admin/bookings/{id}/notes

Corps : `{ "body": "..." }` — note interne sur la demande (ex. litige,
parent injoignable). Réutilise `AdminNote` (voir ci-dessous).

## Utilisateurs

### GET /api/admin/users

Query optionnels : `?role=parent|aesh|admin` et `?search=...` (nom ou email,
sous-chaîne), combinables.

### GET /api/admin/users/{id}

Détail — pour un AESH, inclut `aesh_verification_status`.

### POST /api/admin/users/{id}/suspend

Bloque la connexion (`users.suspended_at`) sans supprimer le compte ni ses
données. Un compte admin ne peut pas être suspendu (422).

### POST /api/admin/users/{id}/reactivate

Retire `suspended_at`.

> Un compte suspendu qui tente `/api/login` reçoit 403 — vérifié juste après
> `Auth::attempt`, avant la régénération de session.

## `AdminNote` — une table, deux cibles

Plutôt qu'une relation polymorphique (sur-ingénierie pour deux cibles
connues) ou une table dupliquée, `admin_notes` a deux clés étrangères
nullables : `aesh_profile_id` (US-08, existant) et `booking_request_id`
(nouveau). Une note référence l'une ou l'autre, jamais les deux — contrôlé
par le controller qui remplit la bonne colonne, pas par une contrainte SQL.

## Hors périmètre volontaire

```
✗ Export CSV — pas fait : le backlog le conditionne à « si rapide », jugé non
  prioritaire devant la visibilité réservations/utilisateurs elle-même
✗ Suspendre un autre admin
✗ Modifier les données d'un utilisateur depuis le cockpit (lecture + suspension
  uniquement)
```

## Frontend

`/dashboard/admin/bookings` · `/dashboard/admin/users`
