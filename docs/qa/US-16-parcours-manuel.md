# Parcours manuel QA — Emails transactionnels & notifications (US-16)

Parcours de recette à rejouer avant chaque merge touchant les notifications.
Complète les tests API de `tests/Feature/NotificationTest.php` et des
nouveaux cas dans `tests/Feature/BookingRequestTest.php` (section « US-16 »).

## Préparation de l'environnement

```bash
orb start  # ou colima start selon la machine
docker-compose up -d              # MySQL + Mailpit (localhost:8025)

cd backend
php artisan migrate --force
php artisan serve                 # http://localhost:8000

cd frontend
npm run dev                       # http://localhost:3000
```

Se connecter via `http://localhost:3000`, pas `127.0.0.1` (cf. contrainte
Sanctum documentée dans le parcours US-11/US-12).

## Parcours nominal — emails

| # | Action | Vérifier dans Mailpit (`localhost:8025`) |
|---|--------|-------------------------------------------|
| 1 | Inscription (parent ou AESH) | Email « Vérifiez votre adresse email », branding Expat Inclusion, bouton fonctionnel |
| 2 | Cliquer le bouton de l'email | Redirige vers `/verifier-email/confirmer/...`, affiche « Votre adresse email est vérifiée » |
| 3 | Mot de passe oublié | Email « Réinitialisation de votre mot de passe », lien vers `/reinitialiser-mot-de-passe` |
| 4 | Parent envoie une demande à un AESH publié | Email « Nouvelle demande de réservation » reçu par l'AESH, lien vers `/dashboard/aesh/demandes` |
| 5 | AESH accepte | Email « Votre demande a été acceptée » reçu par le parent, lien vers la conversation |
| 6 | AESH refuse avec motif | Email « Votre demande a été refusée » reçu par le parent, motif visible |
| 7 | Parent annule une demande acceptée | Email « Une réservation a été annulée » reçu par **l'AESH**, pas par le parent |
| 8 | AESH annule une demande acceptée | Email reçu par **le parent**, pas par l'AESH |

## Parcours nominal — notifications dashboard

| # | Écran | Action | Attendu |
|---|-------|--------|---------|
| 9 | `/dashboard/parent` ou `/dashboard/aesh` | Après un événement (4 à 8 ci-dessus) | La carte « Notifications » affiche le nombre de non-lues |
| 10 | `/dashboard/{role}/notifications` | Ouvrir la liste | La notification apparaît avec un point plein (non lue) |
| 11 | Cliquer sur une notification | Ouverture | Redirige vers l'URL de la notification (conversation, demandes...), le point disparaît |
| 12 | Recharger le dashboard | — | Le compteur ne compte plus cette notification |

## Contrôles d'accès à vérifier

| Test | Attendu |
|------|---------|
| `GET /api/notifications` sans session | `401` |
| `POST /api/notifications/{id}/read` sur la notification d'un autre utilisateur | `404` |
| Compte A ouvre `/dashboard/parent/notifications`, compte B n'y voit rien | Isolation confirmée |

## Points de vigilance métier

- **Vocabulaire** : aucun email ni notification ne doit dire « profil vérifié »
  ou « documents validés » — toujours « candidature examinée par notre
  équipe » quand le statut d'un profil AESH est évoqué (voir
  `docs/api/aesh-detail.md`).
- **`toMail()` qui renvoie un `Mailable`** : Laravel n'ajoute pas
  automatiquement le destinataire dans ce cas — chaque notification doit
  appeler explicitement `->to($notifiable->email, $notifiable->name)`. Oubli
  découvert et corrigé pendant le développement (l'email partait sans
  destinataire, `LogicException` côté Symfony Mailer).
- **Ordre non testé ici** : contrairement à US-13, il n'y a pas de Security
  Rules à déployer dans un ordre précis — tout est côté Laravel/MySQL.
- **Une notification `via(['mail', 'database'])` en queue = deux jobs**, pas
  un seul — Laravel dispatch un job par canal. En local, `php artisan
  queue:work --once` ne traite donc qu'un seul canal à la fois ; utiliser
  `queue:work` (sans `--once`) ou relancer la commande pour vider la queue
  complètement avant de vérifier qu'une notification est bien apparue à la
  fois dans Mailpit et dans `/api/notifications`.

## Résultat du dernier passage

Exécuté le 26 août 2026 en local — suite automatisée verte (137 tests
backend, tsc/lint/build frontend propres). Parcours manuel Mailpit à
rejouer et cocher avant le prochain merge en `dev`.
