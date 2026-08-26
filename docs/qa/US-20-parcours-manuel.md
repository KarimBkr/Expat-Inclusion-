# Parcours manuel QA — Import CSV profils AESH (US-20)

Parcours de recette à rejouer avant chaque merge touchant l'import.
Complète les 10 tests API de `backend/tests/Feature/AeshCsvImportTest.php`.

## Préparation de l'environnement

```bash
orb start
docker compose up -d
cd backend && php artisan migrate --force && php artisan db:seed --force && php artisan serve
cd ../frontend && npm run dev
```

Se connecter en tant qu'admin (`admin@expat-inclusion.test` en local avec
`AdminUserSeeder`).

## Fichier CSV d'exemple

```csv
name,email,bio,experience_years,timezone,phone,specialization_slugs,language_codes,modality_slugs,country_codes,school_level_slugs
Samira Benali,samira.qa@example.com,"Accompagnante spécialisée depuis dix ans, dont sept au sein du réseau AEFE au Moyen-Orient.",10,Europe/Paris,+33612345678,"tsa;tdah","fr;en","presentiel;distanciel","FR;MA",
Thomas Leroy,thomas.qa@example.com,"Spécialisé dans l'accompagnement des troubles Dys au collège depuis six ans.",6,Asia/Singapore,,"dyslexie","fr;en","distanciel","SG",
```

## Parcours nominal

| # | Écran | Action | Attendu |
|---|-------|--------|---------|
| 1 | `/dashboard/admin` | Ouvrir | Carte « Import CSV — profils AESH » visible dans la section Sourcing |
| 2 | `/dashboard/admin/aesh-import` | Consulter le tableau des colonnes | Correspond exactement aux colonnes du CSV d'exemple |
| 3 | Formulaire | Importer le CSV d'exemple (2 lignes valides) | Rapport : « 2 profil(s) importé(s), 0 ligne(s) en erreur » |
| 4 | `/dashboard/admin/aesh` | Filtrer par « En attente » | Les deux profils importés apparaissent |
| 5 | Fiche AESH importée | Approuver puis publier | Passe par le même circuit qu'un profil auto-créé (US-08) |
| 6 | `/dashboard/parent/recherche` | Rechercher | Le profil publié apparaît, comme n'importe quel profil |
| 7 | Page de connexion | Se connecter avec l'email importé | Échoue (mot de passe inconnu) |
| 8 | `/mot-de-passe-oublie` | Renseigner l'email importé | Email de réinitialisation reçu (Mailpit en local) — l'AESH peut ensuite se connecter |

## Contrôles d'erreur à vérifier

| Test | Attendu |
|------|---------|
| Réimporter le même fichier (emails déjà en base) | 0 importé, 2 en erreur, message « déjà utilisée » |
| Ligne avec `specialization_slugs=inexistant` | Cette ligne rejetée, message citant le slug inconnu ; les autres lignes du fichier importées normalement |
| Ligne avec `bio` de moins de 50 caractères | Rejetée avec message de validation explicite |
| En-tête sans `country_codes` | `422` immédiat, aucune ligne traitée |
| Fichier `.pdf` renommé en `.csv` | Rejeté (`422`, format invalide) |
| Parent ou AESH tente d'accéder à `/dashboard/admin/aesh-import` | Redirection hors de la page |
| `POST /api/admin/aesh-import` avec un compte parent | `403` |
| `POST /api/admin/aesh-import` sans session | `401` |

## Points de vigilance métier

- **Le mot de passe généré n'apparaît jamais** dans la réponse HTTP ni dans les
  logs applicatifs — vérifié par test automatisé
  (`test_le_mot_de_passe_genere_nest_jamais_expose`).
- **Aucun contournement de la vérification admin** : un profil importé est
  `pending`, jamais publié automatiquement. À revérifier si le service
  d'import évolue.
- **Pas d'email d'invitation dédié** : l'AESH découvre son compte via un canal
  externe (contact direct de l'équipe sourcing) puis utilise « mot de passe
  oublié ». Ce point est à reconsidérer quand les emails transactionnels
  (US-16) existeront — un email de bienvenue explicite serait alors plus
  approprié qu'un renvoi vers l'AESH s'inscrivant lui-même à trouver le lien.

## Résultat du dernier passage

Exécuté le 26 août 2026 : 10 tests API verts (import valide, mot de passe non
exposé, import partiel, doublon en base, doublon dans le même fichier,
taxonomie inconnue, colonnes manquantes, fichier non-CSV, accès refusé parent,
accès refusé non authentifié). Typecheck, lint et build front verts.
