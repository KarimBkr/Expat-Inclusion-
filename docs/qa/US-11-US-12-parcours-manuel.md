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
