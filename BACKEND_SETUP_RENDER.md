# Mise en place backend + base Render

## 1. Dézipper ce pack à la racine du projet
Les fichiers `App.jsx` et `.env.example` vont à la racine.
Le dossier `backend/` va à la racine aussi.

## 2. Base Postgres Render
Créer une base PostgreSQL sur Render, puis copier l'Internal Database URL.

## 3. Lancer le SQL
Dans Render Postgres, exécuter le fichier `backend/schema.sql`.

## 4. Créer le backend sur Render
- New > Web Service
- Repo : le même repo GitHub
- Root Directory : `backend`
- Build Command : `npm install`
- Start Command : `npm start`

Variables d'environnement :
- `DATABASE_URL` = URL interne Postgres
- `CORS_ORIGIN` = https://climbcrew.onrender.com

## 5. Configurer le frontend
Créer un fichier `.env` à la racine du front avec :
```env
VITE_API_URL=https://TON-BACKEND.onrender.com
```

## 6. Rebuild du site front
Sur le front statique Render, déclencher un nouveau déploiement après ajout de `.env` et du nouvel `App.jsx`.
