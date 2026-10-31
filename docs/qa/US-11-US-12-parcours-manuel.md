# Parcours manuel QA — Demande de réservation (US-11 + US-12)

Parcours de recette à rejouer avant chaque merge touchant les demandes de
réservation. Complète les 27 tests API de `tests/Feature/BookingRequestTest.php`.

## Préparation de l'environnement

```bash
# 1. Infrastructure locale
orb start
docker compose up -d              # MySQL sur 3307, Mailpit sur 8025

# 2. Backend
cd backend
php artisan migrate --force
php artisan db:seed --force       # taxonomies + compte admin
php artisan serve                 # http://localhost:8000

# 3. Frontend
cd frontend
npm run dev                       # http://localhost:3000
```

> Se connecter via `http://localhost:3000` et non `127.0.0.1` : la session
> Sanctum est liée à `SESSION_DOMAIN=localhost` et à
> `SANCTUM_STATEFUL_DOMAINS=localhost:3000`.

## Jeu de données

| Rôle   | Action                                                              |
|--------|---------------------------------------------------------------------|
| AESH   | S'inscrire, compléter le profil (bio, taxonomies), déposer CV et LM |
| Admin  | `/dashboard/admin/aesh` → approuver puis **publier** le profil       |
| Parent | S'inscrire, compléter le profil parent                               |

Un profil non publié n'est ni cherchable ni consultable : c'est volontaire.

## Parcours nominal

| # | Écran | Action | Attendu |
|---|-------|--------|---------|
| 1 | `/dashboard/parent/recherche` | Filtrer par pays / trouble | L'AESH publié apparaît |
| 2 | Carte résultat | « Voir le profil » | Fiche `/aesh/{id}` avec badges de vérification |
| 3 | Fiche AESH | « Demander une réservation » | Formulaire de demande, sans aucun montant |
| 4 | Formulaire | Envoyer avec message < 20 caractères | Erreur de champ sous la zone de texte |
| 5 | Formulaire | Envoyer une date passée | Erreur sur la date |
| 6 | Formulaire | Envoyer un dossier complet | Redirection vers `/dashboard/parent/reservations`, statut **En attente de réponse** |
| 7 | Fiche AESH | Refaire une demande au même AESH | Refus : « Vous avez déjà une demande en attente » |
| 8 | `/dashboard/aesh/demandes` (AESH) | Ouvrir | La demande apparaît avec le nom du parent |
| 9 | Carte demande | « Accepter » | Statut **Acceptée** |
| 10 | Carte demande | « Voir l'historique » | 2 mouvements : création + acceptation |
| 11 | `/dashboard/parent/reservations` | « Annuler la demande » sans motif | Le formulaire bloque (motif requis) |
| 12 | Idem | Annuler avec motif | Statut **Annulée**, motif visible des deux côtés |
| 13 | Historique | Rouvrir | 3 mouvements, avec auteur et motif |

## Contrôles d'accès à vérifier

| Test | Attendu |
|------|---------|
| Parent A ouvre la demande de Parent B (URL directe) | `403` |
| AESH B accepte une demande adressée à AESH A | `403` |
| Parent tente d'accepter sa propre demande | `403` |
| Déconnecté sur `/dashboard/parent/reservations` | Redirection `/connexion` |
| AESH sur `/dashboard/parent/reservations` | Redirection `/dashboard` |

## Machine à états — cas limites

| Depuis | Action | Attendu |
|--------|--------|---------|
| `accepted` | Refuser | `422` « une demande Acceptée ne peut pas passer à Refusée » |
| `declined` | Accepter | `422` |
| `cancelled` | Accepter | `422` |
| `declined` | Nouvelle demande au même AESH | Autorisé (seul `requested` bloque) |

## Points de vigilance métier

- **Aucun montant** : ni la fiche AESH, ni la demande, ni les listes ne doivent
  afficher de tarif. À revérifier à chaque ajout de champ dans les Resources.
- **Aucune coordonnée** : la fiche AESH et les demandes n'exposent ni email ni
  téléphone. À revérifier à chaque ajout de champ dans les Resources.
- **Aucune donnée de santé** : le champ « votre besoin » affiche l'avertissement.
  Ne pas ajouter de champ médical, même optionnel.

## Résultat du dernier passage

Exécuté le 6 août 2026 sur MySQL 8.0 local (`expat_inclusion`), backend
`php artisan serve` — parcours complet vert, y compris les 5 contrôles d'accès
et les 4 transitions interdites.

## Repassage du 31 octobre 2026

Pile locale sans port réseau : backend Laravel sur SQLite appelé en processus, build de production Next.js, navigateur Playwright (suite e2e de recette), `STRIPE_PLATFORM_FEE_ENABLED=false`, sans Mailpit, sans projet Firebase ni compte Stripe. Suite backend : 221 tests verts.

| Étapes | Résultat (31/10/2026) | Rejoué par |
|--------|------------------------|------------|
| 1–3 | OK — recherche filtrée, fiche avec badges, formulaire sans montant (le bouton s'appelle désormais « Envoyer une demande ») | e2e parent (« searches… sends a request ») |
| 4–5 | OK — message trop court et date passée refusés avec erreur de champ | e2e parent + `champs_requis_valides`, `date_de_debut_dans_le_passe_refusee` |
| 6 | OK — écran de confirmation « Demande envoyée » avec lien « Suivre mes demandes », statut « En attente de réponse » (remplace la redirection directe) | e2e parent (« sign-up to conversation ») |
| 7 | OK — seconde demande en attente refusée | `pas_deux_demandes_en_attente_sur_le_meme_aesh` |
| 8–10 | OK — demande visible côté AESH, acceptation, historique | e2e AESH (« accept, decline… ») + `le_detail_expose_l_historique` |
| 11–13 | OK — annulation avec motif, motif et historique visibles | `parent_annule_une_demande_acceptee`, `aesh_annule_une_demande_acceptee` |
| Contrôles d'accès (5) | OK — 403 / redirections | `RouteCoverageTest`, `un_autre_parent_ne_voit_pas_la_demande`, e2e nav |
| Machine à états (4) | OK — 422 sur les transitions interdites | `une_demande_*_ne_peut_plus_etre_*`, `nouvelle_demande_possible_apres_un_refus` |
| Vigilance : aucun montant, aucune coordonnée | OK | e2e AESH (« no price shown »), `aucun_montant_dans_la_demande` |
