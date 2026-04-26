# ClimbCrew — setup DB automatique

Ce pack ajoute deux routes temporaires utiles :

- `/setup-db` : crée les tables manquantes
- `/db-status` : vérifie que les tables existent

## Installation

Remplacer :

```text
backend/server.js
```

par le fichier fourni.

Puis :

```bash
git add backend/server.js
git commit -m "Ajout route setup database"
git push
```

Render redéploiera le backend.

## Utilisation

Ouvrir :

```text
https://climbcrew-api-khf7.onrender.com/setup-db
```

Résultat attendu :

```json
{
  "ok": true,
  "message": "Tables ClimbCrew créées ou déjà existantes"
}
```

Puis vérifier :

```text
https://climbcrew-api-khf7.onrender.com/db-status
https://climbcrew-api-khf7.onrender.com/sessions
```

## Sécurité

Cette route est pratique pour initialiser la base.

Option recommandée :
dans Render, ajouter une variable :

```text
SETUP_TOKEN = un-code-long
```

Puis appeler :

```text
/setup-db?token=un-code-long
```

Après succès, tu peux supprimer la route `/setup-db` du code ou laisser `SETUP_TOKEN` activé.
