# CLAUDE.md — Expat Inclusion

## Contexte projet

Plateforme de mise en relation entre des **AESH** (Accompagnants des Élèves en Situation de Handicap) expatriés et des **familles francophones du réseau AEFE** recherchant un accompagnement spécialisé pour leurs enfants (TSA, TDA/H, troubles Dys, EIP).

**Slogan :** Un pont entre l'accompagnement spécialisé et les familles expatriées.

**Stack :** Next.js · Laravel · Firebase Firestore (chat uniquement) · Stripe Checkout (one-shot)

**Équipe :** Jihad BAKARI & Loucman — chaque feature est livrée verticalement par un owner unique (front + back + tests + QA).

---

## MCP — Installation et usage

Les MCP sont **fortement recommandés**. Les installer et les utiliser activement à chaque session.

```bash
# filesystem — lecture/écriture fichiers (commité dans .mcp.json)
claude mcp add filesystem --scope project -- npx -y @modelcontextprotocol/server-filesystem /chemin/vers/expat-inclusion

# fetch — docs Stripe, Firebase, Laravel (commité dans .mcp.json)
claude mcp add fetch --scope project -- pipx run mcp-server-fetch

# github — branches, PRs, review (stocké en local, non commité)
claude mcp add github --scope local -e GITHUB_TOKEN=<token> -- npx -y @modelcontextprotocol/server-github

# mysql — requêtes BDD, vérification migrations (stocké en local, non commité)
claude mcp add mysql --scope local -- npx -y @berthojoris/mcp-mysql-server mysql://user:password@localhost:3306/expat_inclusion
```

> `--scope local` pour tout ce qui contient un secret (token, mot de passe). Ces valeurs vont dans `~/.claude.json`, jamais dans `.mcp.json` commité.

**Utiliser les MCP en priorité** pour :
- Lire/écrire des fichiers → `filesystem`
- Créer une branche, lire du code, ouvrir une PR → `github`
- Consulter la doc Stripe, Firebase, Laravel Sanctum → `fetch`
- Inspecter la BDD, vérifier une migration → `mysql`

---

## Git — Règles absolues

### Branches

```
main    ← INTERDIT — ne jamais toucher sauf ordre explicite de Jihad ou Loucman
dev     ← branche d'intégration — toutes les features y sont mergées
feature/US-XX-nom-court  ← une branche par feature, créée depuis dev
```

### Workflow feature

```bash
# 1. Partir de dev à jour
git checkout dev && git pull origin dev
git checkout -b feature/US-XX-nom-court

# 2. Développer
# 3. Review (voir section Review)
# 4. Merger dans dev uniquement
git checkout dev
git merge --no-ff feature/US-XX-nom-court
git push origin dev

# 5. Supprimer la branche
git branch -d feature/US-XX-nom-court
```

### Commits

- **Français, concis, impératif**
- **Zéro co-auteur** — `Co-authored-by` interdit
- **Zéro mention d'IA**, de Claude ou d'outil d'assistance

```bash
# Format : type: description courte
feat:     # nouvelle fonctionnalité
fix:      # correction de bug
refactor: # refactoring sans changement de comportement
style:    # formatage uniquement
test:     # ajout ou correction de tests
docs:     # documentation
chore:    # config, dépendances, tâches techniques

# Exemples corrects
git commit -m "feat: ajouter l'inscription par rôle parent/AESH"
git commit -m "fix: corriger la redirection après login"
git commit -m "refactor: extraire la validation email dans un service dédié"
git commit -m "chore: configurer ESLint et Prettier"

# INTERDIT
git commit -m "feat: add auth Co-authored-by: Claude"   ❌
git commit -m "AI generated: user registration"          ❌
git commit -m "update stuff"                             ❌
```

---

## Architecture — Source de vérité

| Composant | Rôle | Ne fait PAS |
|-----------|------|-------------|
| **Next.js** | UI, routing App Router, dashboards, formulaires | Logique métier, auth principale |
| **Laravel** | API, auth Sanctum, métier, BDD, emails, webhooks Stripe, admin | Temps réel |
| **Firebase Firestore** | Conversations et messages temps réel **UNIQUEMENT** | Données métier, auth principale |
| **Stripe Checkout** | Paiement parent one-shot, webhook signé + idempotent | Payouts, Connect, abonnements |
| **MySQL** | Persistance relationnelle — toutes les entités métier | — |

### Domaines

```
Frontend : app.expat-inclusion.com
API      : api.expat-inclusion.com
→ même top-level domain requis pour Sanctum SPA cookie
```

### Monorepo

```
expat-inclusion/
  frontend/   (app/ components/ lib/ services/ types/ tests/)
  backend/    (app/ routes/ database/ storage/ tests/)
  docs/       (api/ product/ qa/)
  .github/workflows/
```

### Flux d'authentification imposé

```
1. Next.js  → GET  /sanctum/csrf-cookie
2. Next.js  → POST /login  ou  /register
3. Next.js  → GET  /me          (récupérer l'utilisateur)
4. Laravel  → émet un custom token Firebase pour le chat
5. Next.js  → se connecte à Firestore avec ce token uniquement
```

---

## Schéma de données minimal

| Domaine | Tables / Collections | Rôle |
|---------|---------------------|------|
| Auth | `users`, `password_reset_tokens`, `sessions` Sanctum | Rôle, email, vérification, mot de passe |
| Profil Parent | `parent_profiles` | Profil minimal, pays, fuseau, consentements |
| Profil AESH | `aesh_profiles`, `aesh_documents` | Profil pro, statut vérification, documents |
| Taxonomies | `specializations`, `languages`, `school_levels`, `countries` + pivots | Filtres et catégories réutilisables |
| Réservation | `booking_requests`, `booking_status_histories` | Demande, statut, historique simple |
| Paiement | `payments` | Session Stripe, montant, statut, booking liée |
| Administration | `admin_notes` | Notes internes sur profils et demandes |
| Temps réel | Firestore `conversations`, `messages` | Temps réel uniquement — rien d'autre dans Firestore |

---

## Backlog MVP — 21 User Stories

| ID | Rôle | User Story | Owner | Sprint |
|----|------|-----------|-------|--------|
| US-01 | Visiteur | Landing page, FAQ, concept, mentions légales, contact | Loucman | S1 |
| US-02 | Visiteur | Créer un compte Parent ou AESH (inscription par rôle) | Jihad | S1 |
| US-03 | Utilisateur | Login, logout, reset mdp, accès routes autorisées, `/me` | Jihad | S1 |
| US-04 | Parent | Profil parent CRUD + brief enfant minimal + consentements | Loucman | S2 |
| US-05 | AESH | Profil professionnel complet (bio, langues, pays, modalités, tarif) | Jihad | S2 |
| US-06 | AESH | Upload documents de vérification (pending/approved/rejected) | Jihad | S2 |
| US-07 | Admin | CRUD taxonomies métier (spécialités, langues, niveaux, pays, modalités) | Loucman | S3 |
| US-08 | Admin | Valider / rejeter / publier un profil AESH | Loucman | S3 |
| US-09 | Parent | Rechercher des AESH avec filtres (pays, trouble, modalité, niveau) | Jihad | S3 |
| US-10 | Parent | Consulter la fiche AESH détaillée + badges vérification + CTA | Jihad | S3 |
| US-11 | Parent | Créer une demande de réservation (statut : requested) | Jihad | S4 |
| US-12 | AESH | Accepter / refuser / annuler une demande (state machine) | Jihad | S4 |
| US-13 | Parent & AESH | Messagerie Firestore liée à la demande + notifications UI | Loucman | S4 |
| US-14 | Parent | Payer une réservation confirmée via Stripe Checkout (one-shot) | Jihad | S5 |
| US-15 | Système | Confirmer paiement via webhook Stripe signé et idempotent | Jihad | S5 |
| US-16 | Utilisateur | Emails transactionnels (vérification, demande, paiement, annulation) | Loucman | S5 |
| US-17 | Parent | Dashboard parent : demandes, paiements, conversations | Jihad | S6 |
| US-18 | AESH | Dashboard AESH : profil, demandes entrantes, statut vérification, docs | Jihad | S6 |
| US-19 | Admin | Cockpit admin : utilisateurs, réservations, paiements, notes internes | Loucman | S6 |
| US-20 | Équipe | Import CSV AESH + seed taxonomies + profils démo + staging propre | Jihad | S7 |
| US-21 | Équipe | Release candidate stable (rate limits, backups, monitoring, smoke tests) | Loucman | S7 |

---

## Plan de sprints — 8 semaines

> **Principe cardinal :** un owner par feature, responsable du front + back + tests + QA. Interdit de faire front/back séparé par personne.

### Sprint 0 — Fondation technique (owner unique : Jihad)

Loucman ne commence pas avant que le Sprint 0 soit livré.

```
- Créer le monorepo expat-inclusion avec frontend/ backend/ docs/ .github/workflows/
- Initialiser Next.js App Router + TypeScript + Tailwind + design tokens minimum
- Initialiser Laravel API : BDD, migrations initiales, exceptions JSON, CORS, Sanctum
- Installer Docker local ou compose minimal pour dev
- Installer Stripe SDK, mail sandbox, queues, Firebase Admin SDK
- Créer le projet Firebase, activer Firestore/Auth, Security Rules de base
- Créer les seeders de taxonomies de base
- Configurer ESLint/Prettier, env.example, conventions Git et CI
- Documenter les conventions d'endpoints et le format de réponse JSON
- Préparer la pipeline tests PHP et migration fresh
```

**Sortie :** projet bootable en local, CI verte, staging prêt, Firebase configuré.

---

### Sprint 1 — Existence publique + authentification

| Jihad | Loucman |
|-------|---------|
| Inscription par rôle Parent/AESH (front + back) | Landing page Expat Inclusion |
| Connexion, déconnexion, reset password, vérification email | Pages concept, FAQ, mentions légales, contact |
| Endpoint `/me` et guards de routes par rôle | Endpoint contact + email réception |
| Dashboard shell par rôle avec redirection après login | SEO minimal : title, description, headings |
| Tests API auth + parcours manuel complet | Responsive mobile/desktop |

**Sortie :** un visiteur comprend le service et peut créer un compte fiable. Pas d'OAuth, magic link ou social login en V1.

---

### Sprint 2 — Onboarding des deux rôles

| Jihad | Loucman |
|-------|---------|
| Profil AESH CRUD (front + back) | Profil parent CRUD (front + back) |
| Spécialisations, langues, pays, modalités, niveaux, tarif | Brief enfant minimal sans document médical |
| Upload documents vérification avec statut | Consentements et rappel minimisation RGPD |
| Completion status et visibilité du profil | Pays, fuseau horaire, téléphone optionnel |
| Validation back stricte et policies | Tests API + UI profil parent |

**Sortie :** deux rôles exploitables avec données minimales et propres.

---

### Sprint 3 — Discovery et vérification des profils

| Jihad | Loucman |
|-------|---------|
| Moteur de recherche AESH avec filtres (front + back) | Admin taxonomies CRUD |
| Pagination, query params, empty states | Admin vérification / rejet / publication AESH |
| Fiche publique AESH détaillée | Notes internes admin |
| Index SQL sur spécialisations/pays/modalités | Pages admin simples mais efficaces |
| CTA demande de réservation | Tests policies admin |

**Sortie :** profils visibles, recherches utiles, contrôle qualité. Pas d'Elasticsearch en V1.

---

### Sprint 4 — Mise en relation réelle

| Jihad | Loucman |
|-------|---------|
| Demande de réservation (front + back) | Messagerie Firebase liée à une demande |
| State machine : requested → accepted / declined / cancelled | Collections Firestore : conversations, messages |
| Historique de statut simple | Security Rules limitées aux participants |
| Dashboard des demandes côté Parent et AESH | Inbox et thread temps réel |
| Tests transitions et permissions | Endpoint Laravel pour émettre le custom token Firebase |

**Sortie :** une demande réelle peut être créée, acceptée/refusée et discutée. Firebase = conversations/messages uniquement.

---

### Sprint 5 — Monétisation MVP

| Jihad | Loucman |
|-------|---------|
| Stripe Checkout Session one-shot | Emails transactionnels en queue (Laravel) |
| Pages success/cancel | Templates : vérification, demande, acceptation, paiement, annulation |
| Table payments et rattachement booking | Notifications dashboard simples |
| Webhook Stripe signé et idempotent | Logs mail et gestion erreurs |
| Mise à jour payment paid et booking confirmed | QA croisée du flux paiement complet |

**Sortie :** paiement sandbox bout en bout. Le webhook est priorité absolue.

> **⚠️ JALON PAIEMENT :** à la livraison de ce sprint → envoyer FACT-2026-002 (1 440 EUR HT) et attendre le virement avant de continuer.

---

### Sprint 6 — Pilotage utilisateur et admin

| Jihad | Loucman |
|-------|---------|
| Dashboard Parent complet (demandes, paiements, conversations, filtres statut) | Cockpit admin users / bookings / payments |
| Dashboard AESH complet (profil, demandes entrantes, documents, statut vérif) | Filtres, détails, notes internes |
| Liens vers conversation et paiement depuis chaque demande | Actions simples admin (publish, suspend, noter) |
| Polish UX des états vides | Export CSV minimal si rapide + smoke tests admin |

**Sortie :** produit utilisable en exploitation manuelle MVP. Pas de backoffice CRM complexe.

---

### Sprint 7 — Buffer, amorçage et lancement

| Jihad | Loucman |
|-------|---------|
| Import CSV AESH depuis sourcing terrain | Hardening sécurité |
| Seed taxonomies et profils démo | Rate limits, backups, monitoring minimal |
| Correction bugs front/back critiques | Runbook production |
| SEO basique final | Smoke tests staging |
| Demo script pour cliente | Checklist release candidate |

**Sortie :** release candidate prête pour production et démo cliente.

> **⚠️ JALON PAIEMENT :** avant de déployer en production → envoyer FACT-2026-003 (1 080 EUR HT) et attendre le virement. Pas de mise en prod sans paiement reçu.

---

## Rythme opérationnel

| Moment | Règle |
|--------|-------|
| Lundi matin | Freeze du scope du sprint et des contrats API |
| Chaque jour | Daily 15 min — blocages déclarés immédiatement |
| Mercredi soir | Intégration staging obligatoire pour les stories en cours |
| Jeudi | QA croisée et correction bugs — aucun ajout de scope |
| Vendredi | Démo staging + validation + préparation backlog sprint suivant |
| Blocage > 24h | Swarm ponctuel, puis retour à l'ownership normal |
| Dérive Sprint 4 ou 5 | Consommer le buffer Sprint 7 — jamais ajouter des features |

---

## Périmètre explicitement hors MVP

```
✗ Stripe Connect et onboarding vendeur
✗ Payouts automatiques aux AESH
✗ Abonnements AESH mensuels
✗ Calendrier avancé synchronisé
✗ Notation et avis publics
✗ Multilingue complet
✗ Bibliothèque de ressources premium
✗ Formations en ligne
✗ Application mobile native
✗ Visioconférence intégrée
✗ Partenariats lycées / portails organismes
```

> **Règle absolue :** si une idée surgit → « Est-ce indispensable à la mise en relation, à la réservation ou au paiement V1 ? » Si non → hors sprint, sans discussion.

---

## Décisions figées — Ne pas rouvrir

| Question | Réponse |
|----------|---------|
| Stripe Connect en V1 ? | **NON** |
| Mettre les profils dans Firestore ? | **NON** |
| Profil enfant complet avec données santé ? | **NON** |
| Avis et notations publics ? | **NON** |
| Multilingue complet maintenant ? | **NON** |
| Abonnements AESH en V1 ? | **NON** |
| Agenda partagé avancé en V1 ? | **NON** |
| Portail partenaires écoles en V1 ? | **NON** |
| Firebase comme backend métier ? | **NON** |
| Deuxième système d'auth dans Next.js ? | **NON** |

---

## Seuil minimal avant ouverture publique

| Indicateur | Seuil requis |
|-----------|-------------|
| Profils AESH vérifiés et publiés | 15 minimum |
| Pays prioritaires couverts | 5 minimum (Europe, Moyen-Orient, Asie) |
| Leads parents identifiés | 30 minimum |
| Profils publics présentables | 100% des profils publiés |
| Temps de réponse support interne | < 24h au lancement |

---

## Definition of Done — Par feature

| Critère | Exigence |
|---------|---------|
| Frontend | Page/composant responsive, états vides, loading, erreurs compréhensibles |
| Backend | Migration, modèle, validation, policy/guard, endpoints documentés |
| Tests | Au moins 1 test API + 1 test parcours manuel documenté par US |
| Sécurité | Accès non autorisé testé, rôle et ownership vérifiés sur chaque endpoint |
| UX | Copie claire, CTA visible, libellés d'erreur utiles |
| Documentation | Contrat API ou décision notable ajouté dans `/docs` si changement |
| Staging | Feature testée sur staging avant merge et clôture de la story |

### Checklist PR obligatoire (avant chaque merge dans dev)

```
[ ] Branche nommée feature/US-XX-short-name — pas de commit direct sur main
[ ] Pas de code mort (fonctions non appelées, imports inutiles, variables non utilisées)
[ ] Pas de console.log, dd(), dump(), var_dump() oubliés
[ ] Pas de TODO/FIXME sans issue associée
[ ] Pas de données sensibles en dur (clé, token, mot de passe)
[ ] Pas de variable secrète exposée côté front
[ ] Frontend responsive, loading, empty state, erreurs gérées
[ ] Backend : Form Request, policy/guard, migrations propres
[ ] Test API Laravel ou test parcours documenté
[ ] Accès refusé testé pour mauvais rôle ou mauvais owner
[ ] Endpoint ou décision ajouté dans docs/ si besoin
[ ] PR relue par l'autre dev, QA sur staging si feature métier
```

---

## Principes de code — SOLID + Clean Code

**Pas d'over-engineering.** Si une solution simple fonctionne, c'est la bonne.

### SOLID en pratique

**S — Single Responsibility** : chaque classe, service, composant a une seule raison de changer.

```php
// ✓ Bien
class BookingService  { public function create(...) {} }
class PaymentService  { public function initiate(...) {} }
class NotificationJob { public function handle(...) {} }

// ✗ Mal
class BookingService {
    public function create(...)      {}
    public function sendEmail(...)   {} // pas sa responsabilité
    public function chargeStripe(...){} // pas sa responsabilité
}
```

**O — Open/Closed** : utiliser les interfaces et abstractions Laravel (contrats, policies).

**L — Liskov Substitution** : les implémentations d'interface sont interchangeables.

**I — Interface Segregation** : des interfaces petites et spécifiques.

**D — Dependency Inversion** : injection de dépendances Laravel, dépendre des abstractions.

### Laravel — Conventions

```php
// Controllers : thin, délèguent au service
public function store(CreateBookingRequest $request, BookingService $service)
{
    $booking = $service->create($request->validated(), auth()->user());
    return BookingResource::make($booking);
}
```

- **Un controller = une ressource**
- **Validation dans les Form Requests** — jamais dans le controller
- **Autorisations dans les Policies** — jamais dans le controller
- **Jobs/Queues** pour les effets de bord (emails, notifications)
- **Pas de logique dans les modèles** au-delà des scopes et relations

### Next.js — Conventions

```typescript
// Typage strict TypeScript partout — pas de `any` sauf cas documenté
// Pas de fetch direct dans les composants — passer par services/
// Un composant = une responsabilité

app/          // routes App Router
components/   // composants UI réutilisables
lib/          // utilitaires purs
services/     // appels API vers Laravel
types/        // types TypeScript partagés
```

---

## Sécurité — Règles absolues

### Variables d'environnement

```bash
# BACK (Laravel) — .env jamais commité
DB_PASSWORD=
STRIPE_SECRET=            # ← JAMAIS côté front
STRIPE_WEBHOOK_SECRET=
FIREBASE_PRIVATE_KEY=

# FRONT (Next.js) — NEXT_PUBLIC_ = clés publiques UNIQUEMENT
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=   # clé publique Stripe
NEXT_PUBLIC_FIREBASE_API_KEY=         # clé publique Firebase

# ABSOLUMENT INTERDIT en NEXT_PUBLIC_
NEXT_PUBLIC_STRIPE_SECRET=            ❌
NEXT_PUBLIC_DB_PASSWORD=              ❌
NEXT_PUBLIC_FIREBASE_PRIVATE_KEY=     ❌
```

> **Règle :** si une variable contient `SECRET`, `PRIVATE`, `PASSWORD` → jamais dans `NEXT_PUBLIC_`, jamais dans le frontend.

### Données sensibles

- **Aucune donnée médicale enfant** stockée ou transitée
- **Aucun document santé** uploadé ou référencé
- **Firestore** : conversations et messages uniquement — aucune donnée métier
- **Laravel** : seule source de vérité pour users, profils, bookings, payments
- **Security Rules Firestore** : bloquent l'accès aux seuls participants d'une conversation

---

## Ce que Claude ne fait JAMAIS

```
✗ Commit ou push sur main sans instruction explicite
✗ Merger une feature dans main
✗ Exposer une variable secrète dans le frontend
✗ Ajouter une dépendance non justifiée (over-engineering)
✗ Créer une abstraction inutile ("on en aura peut-être besoin")
✗ Laisser du code mort dans une PR
✗ Ajouter "Co-authored-by" dans un commit
✗ Mentionner Claude, l'IA ou tout outil d'assistance dans le code, les commits ou la doc
✗ Stocker des données médicales ou sensibles liées aux enfants
✗ Mettre de la logique Stripe dans le frontend
✗ Utiliser Firestore pour autre chose que le chat
✗ Rouvrir une décision figée sans instruction explicite
```

## Ce que Claude fait systématiquement

```
✓ Utiliser les MCP disponibles en priorité
✓ Créer la branche feature depuis dev à jour
✓ Passer la checklist PR avant de proposer un merge
✓ Écrire les commits en français, concis, sans co-auteur
✓ Appliquer SOLID sans sur-abstraire
✓ Typer strictement en TypeScript
✓ Valider dans les Form Requests Laravel
✓ Autoriser dans les Policies Laravel
✓ Tester sur staging avant de valider une feature
✓ Signaler immédiatement tout blocage > 24h
```