# Jalons — mise en ligne V1 (sans paiement)

Périmètre : mise en relation gratuite, tarif fixé hors plateforme entre famille et AESH.
Stripe reste livré mais désactivé (`STRIPE_PLATFORM_FEE_ENABLED=false`).
Hors périmètre : tout ce que `CLAUDE.md` liste dans « Périmètre explicitement hors MVP ».

Chaque jalon se termine par : `pnpm lint && pnpm build` (frontend), `php artisan test` (backend), puis un parcours manuel sur staging.

## Jalon 1 — Parcours parent ✅

- [x] Textes sans paiement (accueil, FAQ, dashboard, succès/annulé)
- [x] Confirmation après envoi de demande, bandeau « demande acceptée », reset des filtres
- [x] Valider : lint + build, parcours inscription → profil → recherche → demande → confirmation → conversation (test e2e automatisé, octobre 2026)

## Jalon 2 — Parcours AESH

- [x] Relire inscription → vérification email → profil → documents (CV + lettre) → statut de vérification
- [x] Demandes entrantes : accepter / refuser avec message clair, état vide, notifications
- [x] Messagerie : accès uniquement après acceptation
- [x] Vérifier qu'aucun tarif n'est affiché ni exposé par l'API publique (champ éventuel côté backend)

## Jalon 3 — Parcours admin

- [x] Vérification / rejet / publication des profils AESH, notes internes
- [x] Import CSV AESH et taxonomies (`docs/qa/US-20-parcours-manuel.md`)
- [x] Cockpit : réservations, utilisateurs, suspension / réactivation
- [x] Décision : liste des paiements admin abandonnée (le détail d'une réservation suffit)

## Jalon 4 — Visiteur et contenu

- [x] Header, footer, contact, mentions légales cohérents avec « pas de paiement »
- [x] Relecture des textes et emails (ton, RGPD, aucune donnée médicale)
- [x] SEO : titres, descriptions, `sitemap`, `robots`, `NEXT_PUBLIC_APP_URL` défini

## Jalon 5 — Sécurité et recette

- [ ] Rôle / ownership / accès refusé testés sur chaque endpoint
- [ ] Parcours QA rejoués : `docs/qa/*.md` (US-11/12, 13, 14/15 en mode frais désactivé, 16, 20)
- [ ] Parcours manuels à écrire pour les US sans fichier QA

## Jalon 6 — Déploiement (actions de l'équipe)

- [ ] Comptes Vercel et Railway, repo importé (`docs/ops/runbook.md`)
- [ ] Domaine : `app.` et `api.` sur le même domaine racine
- [ ] Variables de production : `APP_ENV=production`, `APP_DEBUG=false`, `STRIPE_PLATFORM_FEE_ENABLED=false`
- [ ] Worker de queue actif, backups MySQL, `/up` branché sur un monitoring
- [ ] Secret GitHub `FIREBASE_SERVICE_ACCOUNT` (ou déploiement manuel des Security Rules)

## Jalon 7 — Ouverture publique

- [ ] Seuils : 15 profils AESH publiés, 5 pays, 30 leads parents
- [ ] Script de démo cliente
- [ ] Facturation (FACT-2026-003) conforme au périmètre sans paiement
- [ ] Merge `dev` → `main` sur ordre de Jihad ou Loucman uniquement
