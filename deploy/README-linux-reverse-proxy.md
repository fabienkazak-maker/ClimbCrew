# ClimbCrew — déploiement Linux derrière reverse proxy HTTPS

Ce pack rend ClimbCrew compatible avec un serveur Linux où le certificat SSL/TLS est géré par un reverse proxy externe.

L'application ne doit pas écouter directement en HTTPS. Elle expose uniquement :

- le frontend en HTTP local sur `127.0.0.1:8080` ;
- le backend API en HTTP local sur `127.0.0.1:3000` ;
- PostgreSQL dans le réseau Docker interne.

Le reverse proxy du serveur expose ensuite :

- `https://climbcrew.dip-tcs.com/` vers le frontend ;
- `https://climbcrew.dip-tcs.com/api/` vers le backend.

## Fichiers à ajouter au dépôt

```text
.env.production.example
docker-compose.prod.yml
.dockerignore
backend/Dockerfile.prod
backend/.dockerignore
frontend/Dockerfile.prod
frontend/.env.production
frontend/.dockerignore
frontend/nginx.prod.conf
deploy/nginx/climbcrew.reverse-proxy.example.conf
deploy/systemd/climbcrew-backend.service
deploy/scripts/deploy-docker.sh
deploy/scripts/setup-db.sh
deploy/scripts/healthcheck.sh
deploy/patches/0001-backend-host-linux.patch
deploy/patches/0002-root-package-prod-scripts.patch
deploy/README-linux-reverse-proxy.md
```

## Patch backend recommandé

Le backend doit pouvoir choisir son interface d'écoute via `HOST`.

Appliquer :

```bash
git apply deploy/patches/0001-backend-host-linux.patch
```

Ce patch permet :

- `HOST=0.0.0.0` dans Docker ;
- `HOST=127.0.0.1` en installation systemd classique.

## Patch package.json facultatif

Pour ajouter des commandes npm de production :

```bash
git apply deploy/patches/0002-root-package-prod-scripts.patch
```

## Déploiement Docker recommandé

Sur le serveur :

```bash
cd /opt/climbcrew
cp .env.production.example .env.production
nano .env.production
```

Renseigner au minimum :

- `POSTGRES_PASSWORD` ;
- `DATABASE_URL` avec le même mot de passe ;
- `SETUP_TOKEN` ;
- `FIRST_ADMIN_EMAIL` ;
- `FIRST_ADMIN_PASSWORD`.

Lancer :

```bash
chmod +x deploy/scripts/*.sh
./deploy/scripts/deploy-docker.sh .env.production
```

Initialiser ou vérifier la base :

```bash
./deploy/scripts/setup-db.sh .env.production
./deploy/scripts/healthcheck.sh .env.production
```

## Configuration reverse proxy

Un exemple Nginx est fourni dans :

```text
deploy/nginx/climbcrew.reverse-proxy.example.conf
```

Le responsable serveur doit l'adapter à sa gestion de certificats. L'application ne fournit aucun certificat et ne doit pas gérer le renouvellement SSL/TLS.

## Points de sécurité

- Ne pas committer `.env.production`.
- Ne pas stocker de certificat dans le dépôt.
- Ne pas exposer directement le backend sur Internet.
- Garder `SECURE_COOKIES=true` en production.
- Garder `TRUST_PROXY=1` derrière le reverse proxy.
- Utiliser un `SETUP_TOKEN` long et aléatoire.
