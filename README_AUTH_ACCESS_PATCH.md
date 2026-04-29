# Patch ClimbCrew — authentification, accès et logs

Ce patch ajoute :

- une page de connexion côté frontend ;
- une demande d'accès avec mot de passe fort ;
- une gestion "mot de passe perdu" ;
- une réinitialisation par code généré par l'administrateur ;
- la répudiation / réactivation d'un compte ;
- la conservation des logs de connexion ;
- une section d'administration pour gérer les comptes et consulter les logs ;
- un compte administrateur par défaut :
  - email : `climbcrew@gmail.com`
  - mot de passe : `climbcrew*2026`

## Fichiers à remplacer / ajouter

- `App.jsx`
- `backend/server.js`
- `backend/schema.sql`
- `backend/package.json`

## Déploiement

### 1. Remplacer les fichiers dans le projet local

Dézipper ce patch à la racine de ton projet ClimbCrew.

### 2. Pousser sur GitHub

```bash
git add App.jsx backend/server.js backend/schema.sql backend/package.json
git commit -m "Ajout authentification et logs d'accès"
git push
```

### 3. Mettre à jour le backend

Render backend :
- `npm install`
- puis redéployer le service

Si le backend est sur serveur privé :
- `cd backend && npm install`
- redémarrer le service / PM2

### 4. Initialiser les nouvelles tables

Ouvrir :
- `/setup-db`

### 5. Se connecter

Sur la page de connexion de l'application :

- email : `climbcrew@gmail.com`
- mot de passe : `climbcrew*2026`

⚠️ Change ou supprime ce compte par défaut dès la première mise en service réelle.

## Endpoints ajoutés

### Public
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `POST /auth/request-access`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

### Admin
- `GET /admin/auth/users`
- `GET /admin/auth/logs`
- `POST /admin/auth/users/:id/approve`
- `POST /admin/auth/users/:id/revoke`
- `POST /admin/auth/users/:id/reactivate`
- `POST /admin/auth/users/:id/reset-token`

## Notes

- Les logs de connexion sont conservés dans la table `access_logs`.
- Les sessions de connexion sont conservées dans `user_sessions`.
- Les codes de réinitialisation sont conservés dans `password_reset_tokens`.
- La partie accès / logs est visible dans l'onglet Administration, avec un compte admin authentifié.
