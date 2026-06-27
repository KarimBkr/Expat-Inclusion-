# Auth — Endpoints (US-02 + US-03)

Authentification SPA via Laravel Sanctum (cookie de session).

## Flux imposé

```
1. GET  /sanctum/csrf-cookie   → pose le cookie XSRF-TOKEN
2. POST /api/register          → crée le compte + envoie l'email de vérification
   POST /api/login             → connecte l'utilisateur
3. GET  /api/me                → récupère l'utilisateur connecté
4. POST /api/logout            → déconnecte
```

---

## POST /api/register

Public.

### Corps

| Champ                  | Type   | Requis | Contraintes                           |
|------------------------|--------|--------|---------------------------------------|
| `name`                 | string | oui    | max 100                               |
| `email`                | string | oui    | email valide, max 255, unique         |
| `password`             | string | oui    | min 8, doit contenir lettres+chiffres |
| `password_confirmation`| string | oui    | identique à password                  |
| `role`                 | string | oui    | `parent` \| `aesh` (admin exclu)      |

### Réponses

| Code | Cas                   |
|------|-----------------------|
| 201  | Compte créé           |
| 422  | Validation échouée    |

```json
{
  "message": "Compte créé avec succès. Vérifiez votre email.",
  "user": { "id": 1, "name": "Marie Dupont", "email": "marie@exemple.com", "role": "parent", "email_verified_at": null }
}
```

---

## POST /api/login

Public.

### Corps

| Champ      | Type   | Requis |
|------------|--------|--------|
| `email`    | string | oui    |
| `password` | string | oui    |

### Réponses

| Code | Cas                        |
|------|----------------------------|
| 200  | Connexion réussie          |
| 401  | Identifiants incorrects    |
| 422  | Validation échouée         |

---

## POST /api/logout

Authentifié (`auth:sanctum`).

### Réponses

| Code | Cas                    |
|------|------------------------|
| 200  | Déconnexion réussie    |
| 401  | Non authentifié        |

---

## GET /api/me

Authentifié (`auth:sanctum`).

### Réponses

| Code | Cas                     |
|------|-------------------------|
| 200  | Utilisateur courant     |
| 401  | Non authentifié         |

```json
{ "id": 1, "name": "Marie Dupont", "email": "marie@exemple.com", "role": "parent", "email_verified_at": "2026-06-27T..." }
```

---

## POST /api/forgot-password

Public. Envoie un email de réinitialisation si le compte existe.

Réponse toujours 200 (anti-énumération d'emails).

| Champ   | Type   | Requis |
|---------|--------|--------|
| `email` | string | oui    |

---

## POST /api/reset-password

Public. Réinitialise le mot de passe avec le token reçu par email.

| Champ                  | Type   | Requis |
|------------------------|--------|--------|
| `token`                | string | oui    |
| `email`                | string | oui    |
| `password`             | string | oui    |
| `password_confirmation`| string | oui    |

| Code | Cas                             |
|------|---------------------------------|
| 200  | Mot de passe réinitialisé       |
| 422  | Token expiré / invalide         |

---

## POST /api/email/resend

Authentifié (`auth:sanctum`). Rate limit : 6/min.

Renvoie l'email de vérification si le compte n'est pas encore vérifié.

---

## GET /api/email/verify/{id}/{hash}

Authentifié + lien signé. Vérifie l'email de l'utilisateur.

---

## Guards de routes

| Middleware        | Usage                        |
|-------------------|------------------------------|
| `auth:sanctum`    | Toute route protégée         |
| `role:parent`     | Routes `/api/parent/*`       |
| `role:aesh`       | Routes `/api/aesh/*`         |
| `role:admin`      | Routes `/api/admin/*`        |

Réponse en cas de rôle insuffisant : **403**.
