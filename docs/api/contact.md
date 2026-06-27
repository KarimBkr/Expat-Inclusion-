# POST /api/contact

Endpoint public — soumettre un message de contact.

## Requête

```
POST /api/contact
Content-Type: application/json
```

### Corps

| Champ     | Type   | Requis | Contraintes                        |
|-----------|--------|--------|------------------------------------|
| `name`    | string | oui    | max 100 caractères                 |
| `email`   | string | oui    | format email valide, max 255       |
| `role`    | string | oui    | `parent` \| `aesh` \| `autre`      |
| `subject` | string | oui    | max 200 caractères                 |
| `message` | string | oui    | min 20, max 2000 caractères        |

### Exemple

```json
{
  "name": "Jean Dupont",
  "email": "jean@exemple.com",
  "role": "parent",
  "subject": "Recherche AESH à Dubaï",
  "message": "Bonjour, je recherche un accompagnant pour mon enfant TSA expatrié à Dubaï."
}
```

## Réponses

| Code | Cas                                   |
|------|---------------------------------------|
| 201  | Message enregistré et job en queue    |
| 422  | Validation échouée                    |
| 429  | Trop de requêtes (throttle 5/min)     |

### 201 — Succès

```json
{ "message": "Message envoyé avec succès." }
```

### 422 — Validation échouée

```json
{
  "message": "The name field is required.",
  "errors": {
    "name": ["Votre nom est requis."]
  }
}
```

## Comportement

- Le message est dispatché en queue via `SendContactEmail` (job)
- Le mail est envoyé à `MAIL_FROM_ADDRESS` (config Laravel)
- Le `Reply-To` est positionné sur l'email de l'expéditeur
- Pas d'authentification requise
- Rate limit : 5 requêtes par minute par IP (`throttle:5,1`)
