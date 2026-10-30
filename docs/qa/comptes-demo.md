# Comptes et jeu de démonstration

Jeu de données prêt à projeter, en environnement de développement uniquement.
Le seeder refuse de s'exécuter si `APP_ENV=production`.

## Mise en place

```bash
orb start
docker compose up -d

cd backend
php artisan migrate:fresh --force      # repart d'une base vide
php artisan db:seed --force            # taxonomies + admin
php artisan db:seed --class=DemoSeeder --force
php artisan serve

cd ../frontend && npm run dev
```

Se connecter sur `http://localhost:3000` — jamais sur `127.0.0.1`, la session
Sanctum est liée à `localhost`.

Pour repartir d'un état propre entre deux démonstrations, rejouer les trois
commandes `artisan` ci-dessus : `migrate:fresh` efface les demandes créées
pendant la démo précédente.

## Comptes

Mot de passe commun : **`Password1`**

| Rôle | Email | Ce qu'il permet de montrer |
|------|-------|-----------------------------|
| Admin | `admin@expat-inclusion.test` | Catégories métier, file de vérification, publication, notes internes |
| Famille | `famille@expat-inclusion.test` | Profil complet (Dubaï, enfant en CE2, TSA), recherche, fiche, demande |
| AESH | `samira.aesh@expat-inclusion.test` | Profil publié, CV et lettre de motivation déposés, demandes reçues |
| AESH | `thomas.aesh@expat-inclusion.test` | Profil publié, distanciel, troubles Dys |
| AESH | `nadia.aesh@expat-inclusion.test` | Profil publié, EIP, lettre de motivation encore en attente |
| AESH | `claire.aesh@expat-inclusion.test` | Profil publié le plus récent, candidature complète approuvée |
| AESH | `julien.aesh@expat-inclusion.test` | **Profil en attente** — à valider en direct côté admin |

## Profils AESH publiés

Quatre profils volontairement contrastés, pour que chaque filtre de recherche
renvoie un résultat différent.

| AESH | Pays | Spécialités | Modalité | Niveaux |
|------|------|-------------|----------|---------|
| Samira Benali | Émirats, Qatar | TSA, TDA/H | Présentiel, hybride | CP → CM1 |
| Thomas Leroy | Singapour, Hong Kong | Dyslexie, dysorthographie, dyspraxie | Distanciel | 6e → 3e |
| Nadia Fassi | Maroc, Sénégal | EIP, troubles du comportement | Présentiel | CM1 → 5e |
| Claire Morvan | Japon, Chine | Dyspraxie, dyscalculie | Hybride, distanciel | Maternelle → CE2 |

Julien Roux (Espagne, TSA, lycée) reste **en attente de vérification** : c'est
lui qui alimente la démonstration du circuit de validation admin.

## Filtres qui donnent un résultat parlant

| Filtre / tri | Résultat attendu |
|--------------|------------------|
| Pays = Émirats arabes unis | Samira Benali seule |
| Langue parlée = Japonais | Claire Morvan seule |
| Modalité = Présentiel | Samira Benali et Nadia Fassi |
| Niveau = Maternelle | Claire Morvan seule |
| Trier par = Plus d'expérience | Claire Morvan (14 ans) en tête, puis Samira (11), Nadia (9), Thomas (6) |
| Aucun filtre/tri | 4 résultats, du plus récemment publié au plus ancien |

> Le filtre par trouble accompagné a été retiré de la recherche (remplacé par
> le tri par expérience) — le trouble reste visible en étiquette sur chaque
> résultat, sans réduire la liste.

## Documents

Chaque profil porte un CV et, pour la plupart, une lettre de motivation —
des fichiers réellement écrits sur disque, pour que le téléchargement depuis
l'espace AESH fonctionne pendant la démo. Ce sont des fichiers de substitution,
pas de vrais documents.

Les statuts sont volontairement mélangés (approuvé / en attente) pour montrer le
suivi de candidature côté AESH. Rien de tout cela n'apparaît sur la fiche
publique : elle n'affiche qu'un badge « Candidature examinée par notre équipe ».

## Points de vigilance

- Le mot de passe est commun et connu : ce jeu de données ne doit jamais être
  déployé ailleurs qu'en développement.
- `migrate:fresh` **efface toute la base**. Ne jamais l'exécuter sur un
  environnement partagé.
- Le compte famille a déjà son profil complet : la démonstration peut aller
  directement à la recherche sans repasser par le formulaire de profil.
