# Déployer ClimbCrew sur Render

Ce document décrit le déploiement de test ou de démonstration sur Render. Le déploiement de production sur serveur Linux reste décrit dans `README.md` et dans `deploy/README-linux-reverse-proxy.md`.

## Architecture Render

```text
Navigateur
  ├─ ClimbCrew-frontend : site statique React/Vite
  └─ ClimbCrew-api      : service web Node/Express
                              ↓ connexion privée Render
                         ClimbCrew-db : PostgreSQL
```

Le frontend et le backend utilisent deux origines HTTP distinctes. Les cookies de session sont donc configurés avec `Secure` et `SameSite=None`. Le module `backend/deployment-compatibility.js` ajoute une compatibilité CSRF limitée aux origines CORS explicitement autorisées.

**Impact visuel :** cette architecture ne change pas la mise en page. Elle évite les écrans vides, les données qui ne se chargent pas et les boutons qui retournent une erreur 403 après une connexion réussie.

## Ressources décrites par le Blueprint

Le fichier `render.yaml` définit :

- `ClimbCrew-api`, service web Node ;
- `ClimbCrew-frontend`, site statique Vite ;
- `ClimbCrew-db`, base PostgreSQL.

Les noms sont conservés pour permettre à Render de rapprocher le Blueprint des services existants portant les mêmes noms.

## Création ou rattachement du Blueprint

1. Ouvrir le tableau de bord Render.
2. Choisir **New > Blueprint**.
3. Sélectionner le dépôt `fabienkazak-maker/ClimbCrew`.
4. Vérifier que Render détecte `render.yaml` à la racine.
5. Renseigner les deux secrets demandés :
   - `FIRST_ADMIN_EMAIL` ;
   - `FIRST_ADMIN_PASSWORD`.
6. Lancer la synchronisation.

`SETUP_TOKEN` est généré automatiquement par Render. `DATABASE_URL`, l'URL publique du frontend et le nom public du backend sont reliés automatiquement entre les ressources ; ils ne sont pas enregistrés dans GitHub.

## Construction automatique de l'adresse API

Render attribue parfois un suffixe au sous-domaine public, par exemple `climbcrew-api-xxxx.onrender.com`. Le Blueprint évite de coder ce suffixe en dur :

1. `CLIMBCREW_API_HOST` récupère `RENDER_EXTERNAL_HOSTNAME` depuis `ClimbCrew-api` ;
2. la commande de build du frontend construit `VITE_API_URL=https://<hôte>/api` ;
3. Vite incorpore cette URL dans le bundle JavaScript.

Cette étape est exécutée à chaque build du frontend. Une modification de la variable nécessite donc une reconstruction, pas seulement un redémarrage.

## Variables essentielles du backend

Le Blueprint configure automatiquement :

```env
NODE_ENV=production
TRUST_PROXY=1
SECURE_COOKIES=true
COOKIE_SAMESITE=none
CROSS_ORIGIN_CSRF_BRIDGE=true
PG_SSL=false
```

Render fournit lui-même `PORT`. Il ne faut pas créer manuellement une valeur fixe pour cette variable.

La connexion PostgreSQL utilise l'URL interne Render. Cette connexion privée ne nécessite pas TLS ; `PG_SSL=false` est donc volontaire. Une connexion externe utilisée depuis un poste local doit, elle, suivre les règles TLS indiquées par Render.

## Origines CORS

Le Blueprint injecte l'URL publique réelle de `ClimbCrew-frontend` dans `RENDER_FRONTEND_URL`. Le backend la fusionne avec :

- `CORS_ORIGIN` lorsqu'elle est définie manuellement ;
- `FRONTEND_ORIGIN` pour la compatibilité historique ;
- `PUBLIC_URL`, actuellement `https://climbcrew.dip-tcs.com` ;
- `http://localhost:5173` pour le développement local.

Aucune origine reçue dans une requête n'est ajoutée automatiquement. La liste reste fermée et déterminée par la configuration.

## Protection CSRF entre deux sous-domaines

Sur Linux, le frontend appelle `/api` sous le même domaine et peut lire le cookie CSRF. Sur Render, le cookie appartient au domaine de l'API : le JavaScript du frontend ne peut pas le lire directement.

Le pont CSRF applique la séquence suivante :

1. il ignore les méthodes de lecture `GET`, `HEAD` et `OPTIONS` ;
2. il conserve tout en-tête CSRF déjà fourni ;
3. il vérifie que l'en-tête `Origin` correspond exactement à une origine CORS autorisée ;
4. il copie le cookie CSRF dans l'en-tête interne de la requête ;
5. le contrôle historique de `server.js` compare ensuite le cookie et l'en-tête.

Une origine non autorisée, une requête sans origine identifiable ou une requête sans cookie reste refusée.

## Messagerie Gmail

Les paramètres SMTP ne sont pas écrits dans `render.yaml`, afin de ne jamais écraser une configuration existante ni exposer un secret.

Pour activer la messagerie dans `ClimbCrew-api`, ajouter dans **Environment** :

```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_USER=cristal.climbcrew@gmail.com
SMTP_PASSWORD=<mot de passe d'application Google>
EMAIL_FROM_NAME=ClimbCrew
EMAIL_FROM_ADDRESS=cristal.climbcrew@gmail.com
RESET_TOKEN_DURATION_MINUTES=60
```

Le mot de passe doit être un mot de passe d'application Google, jamais le mot de passe principal du compte Gmail.

## Contrôles après déploiement

### 1. Backend seul

Ouvrir l'URL publique de `ClimbCrew-api` :

```text
/health
```

Résultat attendu :

```json
{"ok":true}
```

Une réponse `500` indique généralement que `DATABASE_URL` est incorrecte ou que PostgreSQL n'est pas disponible.

### 2. Frontend

Ouvrir `ClimbCrew-frontend`, puis vérifier dans les outils réseau du navigateur :

- que les appels partent vers `https://<backend>/api/...` ;
- que les réponses CORS autorisent l'origine du frontend ;
- que les requêtes utilisent `credentials: include` ;
- qu'une modification ne retourne pas `403 Protection CSRF`.

### 3. Test automatisé du backend

Depuis le dossier `backend` :

```bash
npm test
```

Les tests vérifient la fusion des origines, la conservation des valeurs Linux et le refus des origines non autorisées par le pont CSRF.

## Compatibilité Linux conservée

Le Blueprint Render ne modifie pas les fichiers utilisés en production Linux :

- `docker-compose.prod.yml` continue d'orchestrer les trois conteneurs ;
- `.env.production` reste la source de configuration ;
- `VITE_API_URL=/api` conserve une API sous le même domaine ;
- `COOKIE_SAMESITE=lax` peut rester utilisé sur Linux ;
- le reverse proxy HTTPS continue de terminer TLS et de répartir `/` et `/api/`.

Le module de compatibilité n'impose les valeurs Render que lorsque `RENDER=true`. Toute valeur explicitement définie dans `.env.production` reste prioritaire.

## Diagnostic rapide

| Symptôme | Cause probable | Vérification |
|---|---|---|
| Service backend arrêté | `DATABASE_URL` absente ou invalide | logs de `ClimbCrew-api` |
| `/health` retourne 500 | PostgreSQL inaccessible | liaison `fromDatabase` |
| Écran vide | URL API absente du build Vite | variable `CLIMBCREW_API_HOST` et nouveau build |
| Erreur CORS | frontend absent des origines | `RENDER_FRONTEND_URL` |
| Connexion réussie puis erreur 403 | cookie/CSRF inter-domaines | `COOKIE_SAMESITE=none` et pont CSRF |
| Courriel non envoyé | SMTP absent ou mot de passe incorrect | variables Gmail et logs backend |
