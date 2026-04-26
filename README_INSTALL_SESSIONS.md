# ClimbCrew — persistance séances + inscriptions

Ce pack ajoute la sauvegarde en base pour :

- `sessions`
- `session_participants`
- inscriptions aux séances

## Fichiers à remplacer

À la racine du projet :

- remplacer `App.jsx`

Dans le dossier `backend/` :

- remplacer `backend/server.js`
- remplacer ou compléter `backend/schema.sql`

## SQL à exécuter sur Render PostgreSQL

Copier le contenu de :

```text
backend/schema.sql
```

dans le Query Editor de la base PostgreSQL Render, puis exécuter.

## Déploiement

Après remplacement des fichiers :

```bash
git add .
git commit -m "Ajout persistance sessions et inscriptions"
git push
```

Render redéploiera le frontend et le backend.

## Tests

API backend :

```text
https://climbcrew-api-khf7.onrender.com/health
https://climbcrew-api-khf7.onrender.com/sessions
```

Test fonctionnel :

1. ouvrir https://climbcrew.onrender.com
2. ajouter un inscrit à une séance
3. recharger la page
4. vérifier que l’inscription reste
