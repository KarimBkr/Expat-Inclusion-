# Fiche AESH détaillée — Endpoint (US-10)

Consultation de la fiche complète d'un AESH **publié** par un parent
authentifié, en amont d'une demande de réservation.

> Un profil non publié (`pending`, `approved`, `rejected`) renvoie `404` et non
> `403` : l'existence d'un profil non publié ne fuite pas.
> Aucune donnée de contact (email, téléphone) n'est exposée — la mise en
> relation passe exclusivement par une demande de réservation.
> Aucun tarif n'est exposé : la rémunération se convient hors plateforme.

Authentification : `auth:sanctum` + `role:parent` (`401` sans session, `403` pour
un autre rôle).

---

## GET /api/parent/aesh-profiles/{id}

`id` doit être numérique (contrainte `whereNumber`).

### Réponse `200`

```json
{
  "data": {
    "id": 1,
    "name": "Samira Benali",
    "bio": "Accompagnante spécialisée TSA avec dix ans de terrain en réseau AEFE.",
    "experience_years": 10,
    "timezone": "Europe/Paris",
    "verification_status": "published",
    "published_at": "2026-07-20T10:12:00+00:00",
    "specializations": [{ "id": 1, "name": "TSA" }],
    "languages": [{ "id": 1, "name": "Français" }],
    "modalities": [{ "id": 1, "name": "Présentiel" }],
    "countries": [{ "id": 1, "name": "France" }],
    "school_levels": [{ "id": 2, "name": "CP" }]
  }
}
```

### Ce que la fiche affirme — et ce qu'elle n'affirme pas

| Champ                 | Signification                                              |
|-----------------------|------------------------------------------------------------|
| `verification_status` | Toujours `published` sur cet endpoint — profil approuvé par un admin |
| `published_at`        | Date de publication par l'admin (US-08)                     |

Le front affiche un unique badge, **« Candidature examinée par notre équipe »**.
Ce libellé décrit exactement ce que fait le circuit d'US-08 : un humain a lu le
dossier, l'a approuvé et publié.

Ne pas réintroduire de libellé du type « profil vérifié » ou « documents
validés » : seuls un CV et une lettre de motivation sont collectés, et aucune
pièce d'identité ni diplôme n'est contrôlé. Le champ `documents_verified` a été
retiré pour cette raison.

### Erreurs

| Code  | Cas                                                     |
|-------|---------------------------------------------------------|
| `401` | Non authentifié                                          |
| `403` | Rôle AESH ou admin                                       |
| `404` | Profil inexistant **ou** non publié                      |
