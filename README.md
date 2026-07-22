# ClimbCrew — serveur Linux

ClimbCrew est une application de gestion de club d’escalade composée de :

- un frontend React/Vite servi par Nginx ;
- un backend Node.js/Express ;
- une base PostgreSQL ;
- un déploiement Docker Compose pour Linux ;
- un reverse proxy HTTPS externe au projet.

## Architecture

```text
Internet
  ↓
Reverse proxy HTTPS du serveur Linux
  ↓
Frontend : 127.0.0.1:8080
Backend API : 127.0.0.1:3000
  ↓
PostgreSQL dans le réseau Docker
```

Le certificat TLS est géré par le reverse proxy du serveur. ClimbCrew n’expose pas directement PostgreSQL et n’embarque aucun certificat.

## Prérequis

- serveur Linux ;
- Docker Engine ;
- plugin Docker Compose ;
- Git ;
- un nom de domaine configuré vers le serveur ;
- un reverse proxy HTTPS existant.

## Installation

```bash
sudo mkdir -p /opt/climbcrew
sudo chown "$USER":"$USER" /opt/climbcrew
git clone https://github.com/fabienkazak-maker/ClimbCrew.git /opt/climbcrew
cd /opt/climbcrew
cp .env.production.example .env.production
nano .env.production
```

Renseigner au minimum les mots de passe PostgreSQL, `DATABASE_URL`, `SETUP_TOKEN`, `FIRST_ADMIN_EMAIL` et `FIRST_ADMIN_PASSWORD`.

## Déploiement

```bash
chmod +x deploy/scripts/*.sh
./deploy/scripts/deploy-docker.sh .env.production
./deploy/scripts/setup-db.sh .env.production
./deploy/scripts/healthcheck.sh .env.production
```

Commandes npm équivalentes :

```bash
npm run prod:config
npm run prod:up
npm run prod:logs
npm run prod:health
```

## Reverse proxy HTTPS

Adapter le fichier :

```text
deploy/nginx/climbcrew.reverse-proxy.example.conf
```

Le reverse proxy doit envoyer :

- `/` vers `http://127.0.0.1:8080` ;
- `/api/` vers `http://127.0.0.1:3000`.

## Sécurité

- ne jamais versionner `.env.production` ;
- conserver `SECURE_COOKIES=true` ;
- conserver `TRUST_PROXY=1` derrière le reverse proxy ;
- utiliser des secrets longs et uniques ;
- ne pas exposer directement PostgreSQL ni le backend ;
- sauvegarder régulièrement le volume `climbcrew_pgdata`.

La documentation détaillée se trouve dans [deploy/README-linux-reverse-proxy.md](deploy/README-linux-reverse-proxy.md).
