# Admin — Vérification profils AESH (US-08)

Workflow admin : **pending → approved → published** ou **pending → rejected**.

> Le profil professionnel complet (langues, pays, modalités, niveaux, spécialités) a été livré par US-05/06. Aucun tarif n'est collecté : la rémunération se convient hors plateforme.

## Statuts

| Statut | Description |
|--------|-------------|
| `pending` | Soumis, en attente de review admin |
| `approved` | Vérification OK, pas encore visible publiquement |
| `rejected` | Refusé avec motif |
| `published` | Visible pour la recherche parent (US-09) |

---

## GET /api/admin/aesh-profiles

Query optionnel : `?status=pending|approved|rejected|published`

## GET /api/admin/aesh-profiles/{id}

Détail + notes internes.

## POST /api/admin/aesh-profiles/{id}/approve

Profil `pending` uniquement.

## POST /api/admin/aesh-profiles/{id}/reject

Corps : `{ "rejection_reason": "..." }` — profil `pending` uniquement.

## POST /api/admin/aesh-profiles/{id}/publish

Profil `approved` uniquement.

## POST /api/admin/aesh-profiles/{id}/notes

Corps : `{ "body": "..." }` — note interne admin (non visible des utilisateurs).

---

## Vérification renforcée par entretien

Deuxième niveau de confiance, **orthogonal** au workflow pending/approved/
published ci-dessus : accordable sur un profil à n'importe quel statut, sans
dépendre d'une approbation ou d'une publication préalable.

**Cas d'usage** : l'admin a un doute sur une compétence revendiquée (ex. un
profil qui met en avant le TSA) et veut s'assurer que ce n'est pas une
déclaration de façade avant de faire confiance à la candidature. Processus :

1. L'admin note son doute dans les notes internes (`POST .../notes`).
2. Elle saisit un lien de visioconférence (Teams, Google Meet, ou tout autre
   outil de son choix) et envoie l'invitation (`POST .../interview-invitation`
   ci-dessous) — l'AESH reçoit un email avec le lien. **Entièrement hors
   plateforme** : aucune prise de rendez-vous, aucune visioconférence intégrée
   (hors périmètre MVP, voir CLAUDE.md) — l'app se contente de relayer par
   email un lien que l'admin a créé elle-même sur l'outil de son choix.
3. Elle mène l'entretien.
4. Si l'entretien confirme la compétence, elle l'enregistre via
   `interview-verify`. Le badge public **« Compétences vérifiées par
   entretien »** apparaît alors sur la fiche AESH et sur les cartes de
   résultat de recherche — voir `docs/api/aesh-detail.md` pour le détail du
   libellé et de ce qu'il affirme.

Si l'entretien confirme au contraire le doute, l'admin utilise le circuit
existant (`reject` si le profil est encore `pending`, ou une note interne
sinon) : il n'y a pas d'état « entretien échoué » distinct.

### POST /api/admin/aesh-profiles/{id}/interview-invitation

Corps : `{ "meeting_link": "https://...", "message": "..." }` (`message`
optionnel, `meeting_link` doit être une URL valide).

Envoie un email à l'AESH (`InterviewInvitationNotification` — canaux `mail` +
`database`, mise en file d'attente comme les autres notifications
transactionnelles) contenant le lien et le message éventuel. Consigne aussi
l'envoi dans les notes internes du profil (lien et message inclus), pour
garder une trace sans ajouter de colonne dédiée à un événement ponctuel.

> Le job passe par la file d'attente (`QUEUE_CONNECTION=database`) : un worker
> (`php artisan queue:work`) doit tourner pour que l'email parte réellement.
> Vérifié en environnement de dev le 14/09/2026 : aucun worker n'était actif,
> plusieurs notifications (dont celle-ci) restaient en attente dans la table
> `jobs`. À surveiller en production — voir `docs/ops/runbook.md`.

### POST /api/admin/aesh-profiles/{id}/interview-verify

Aucun corps. Enregistre `interview_verified_at = now()`.

### DELETE /api/admin/aesh-profiles/{id}/interview-verify

Retire la vérification (correction d'une saisie admin). Remet
`interview_verified_at` à `null`.

---

## Frontend

`/dashboard/admin/aesh`
