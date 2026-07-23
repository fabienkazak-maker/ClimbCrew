# ClimbCrew

ClimbCrew est une application de gestion de club d’escalade. Elle regroupe les inscriptions aux séances, les participants, les voies et les réalisations.

## Architecture

- Frontend React, Vite et TypeScript strict
- Backend Express et TypeScript strict exécuté par Bun
- PostgreSQL comme source de vérité
- Authentification par cookie HttpOnly et protection CSRF
- Déploiement Linux avec Docker Compose et reverse proxy HTTPS

Le frontend appelle l’API sous `/api`. Le reverse proxy dirige le frontend vers `127.0.0.1:8080` et l’API vers `127.0.0.1:3000`. PostgreSQL reste privé dans le réseau Docker.

## Développement

Prérequis : Bun 1.3.14 et PostgreSQL.

```bash
bun install
cp backend/.env.example backend/.env
bun run backend:dev
bun run dev
```

Le frontend utilise `http://localhost:5173` et le backend `http://localhost:3000` par défaut.

## Validation

```bash
bun run lint
bun run typecheck
bun run build
bun run test:e2e
```

La suite complète construit la pile Docker isolée, exécute les tests API, puis vérifie Chromium et Firefox sur les formats desktop et mobile. Les secrets, comptes et données de test sont générés à chaque exécution, puis le volume PostgreSQL temporaire est supprimé.

## Production

```bash
cp .env.production.example .env.production
bun run prod:config
bun run prod:up
bun run prod:setup-db
bun run prod:health
```

Renseigner des valeurs uniques et robustes pour PostgreSQL, `SETUP_TOKEN`, `FIRST_ADMIN_EMAIL` et `FIRST_ADMIN_PASSWORD` avant le premier démarrage.

Le certificat TLS est géré par le reverse proxy du serveur. Les routes attendues sont :

- `/` vers `http://127.0.0.1:8080`
- `/api/` vers `http://127.0.0.1:3000`

La configuration détaillée se trouve dans [deploy/README-linux-reverse-proxy.md](deploy/README-linux-reverse-proxy.md).

## Données

Les exports réels ne doivent jamais être versionnés. `backend/import-data.example.json` documente uniquement la structure vide attendue. L’import administrateur est transactionnel et les routes de maintenance nécessitent `SETUP_TOKEN`.
