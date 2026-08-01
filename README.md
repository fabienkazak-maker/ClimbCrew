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
- un reverse proxy HTTPS existant ;
- un compte SMTP pour les courriels de création et de réinitialisation des comptes.

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

Pour activer les courriels, renseigner également `EMAIL_ENABLED=true`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` et `EMAIL_FROM_ADDRESS`.

## Messagerie des comptes

Le backend envoie deux types de courriels transactionnels :

- une confirmation après l’enregistrement d’une demande de création de compte ;
- un code à usage unique lorsqu’un utilisateur actif signale la perte de son mot de passe.

Le code de réinitialisation est valable 60 minutes par défaut. La durée peut être changée avec `RESET_TOKEN_DURATION_MINUTES`. Lorsqu’un nouveau code est demandé, les anciens codes non utilisés sont invalidés.

Le service utilise SMTP via Nodemailer. Configuration courante :

```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_USER=climbcrew@example.com
SMTP_PASSWORD=CHANGE_ME
EMAIL_FROM_NAME=ClimbCrew
EMAIL_FROM_ADDRESS=climbcrew@example.com
EMAIL_REPLY_TO=club@example.com
RESET_TOKEN_DURATION_MINUTES=60
```

Pour le port 465, utiliser `SMTP_SECURE=true` et `SMTP_REQUIRE_TLS=false`.

En cas d’échec SMTP :

- la demande de création du compte reste enregistrée ;
- un code de réinitialisation non envoyé est immédiatement invalidé ;
- l’échec apparaît dans l’onglet des logs administrateur ;
- aucune réponse publique ne confirme si une adresse existe ou non.

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
- sauvegarder régulièrement le volume `climbcrew_pgdata` ;
- utiliser un mot de passe SMTP dédié et ne jamais le placer dans le frontend ;
- configurer SPF, DKIM et DMARC sur le domaine d’envoi lorsque le fournisseur le permet.

La documentation détaillée se trouve dans [deploy/README-linux-reverse-proxy.md](deploy/README-linux-reverse-proxy.md).
