# Installation Ubuntu - ClimbCrew

Ce document décrit la procédure d'installation de ClimbCrew sur un serveur Ubuntu.

Il distingue deux usages :

- **test technique Ubuntu** : vérifier que l'application démarre sur un serveur Linux avec Docker ;
- **production réelle** : serveur accessible avec un vrai nom de domaine, HTTPS réel et secrets sécurisés.

> La configuration actuelle du dépôt contient encore des éléments prévus pour le local Windows : ports `8080/8443`, certificat `localhost`, compte admin de test et variables de développement. Elle peut servir à tester Ubuntu, mais elle ne doit pas être utilisée telle quelle comme production publique.

---

## 1. Architecture cible

```text
PC Windows de développement
        ↓ git push
GitHub
        ↓ GitHub Actions
Serveur Ubuntu
        ↓ Docker Compose
nginx + backend Node.js + PostgreSQL
        ↓
https://votre-domaine
```

Dossier recommandé sur Ubuntu :

```bash
/opt/climbcrew
```

---

## 2. Prérequis

Serveur recommandé :

```text
Ubuntu Server 22.04 LTS ou 24.04 LTS
2 vCPU minimum
2 Go RAM minimum, 4 Go recommandé
20 Go disque minimum
Accès SSH
Utilisateur avec droits sudo
Nom de domaine pointant vers le serveur pour la production
```

Ports nécessaires :

```text
22/tcp  SSH
80/tcp  HTTP, utile pour Let's Encrypt
443/tcp HTTPS
```

---

## 3. Mise à jour du serveur

Connectez-vous en SSH au serveur Ubuntu, puis lancez :

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl git gnupg unzip openssl ufw
```

Activez le pare-feu :

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 4. Installation de Docker Engine

Installer Docker Engine depuis le dépôt officiel Docker :

```bash
sudo apt update
sudo apt install -y ca-certificates curl

sudo install -m 0755 -d /etc/apt/keyrings

sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc

sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Vérifiez l'installation :

```bash
sudo systemctl status docker
sudo docker run hello-world
docker compose version
```

Ajoutez l'utilisateur courant au groupe Docker :

```bash
sudo usermod -aG docker $USER
```

Déconnectez-vous puis reconnectez-vous en SSH pour appliquer le groupe Docker.

---

## 5. Récupération du code ClimbCrew

Créez le dossier d'application :

```bash
sudo mkdir -p /opt/climbcrew
sudo chown -R $USER:$USER /opt/climbcrew
```

Clonez le dépôt :

```bash
git clone https://github.com/fabienkazak-maker/ClimbCrew.git /opt/climbcrew
cd /opt/climbcrew
```

Si le dépôt GitHub est privé, utilisez une clé SSH GitHub ou un token d'accès personnel.

---

## 6. Premier test technique Ubuntu avec la configuration locale

Cette étape sert uniquement à vérifier que le code fonctionne sur Ubuntu.

### 6.1 Créer un certificat local de test

Le fichier `docker-compose.https.yml` attend les fichiers suivants :

```text
certs/localhost.crt
certs/localhost.key
```

Créez-les avec OpenSSL :

```bash
cd /opt/climbcrew
mkdir -p certs

openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
  -keyout certs/localhost.key \
  -out certs/localhost.crt \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

chmod 600 certs/localhost.key
chmod 644 certs/localhost.crt
```

### 6.2 Builder le frontend

La configuration nginx sert les fichiers statiques depuis `frontend/dist`. Il faut donc construire le frontend avant de lancer Docker Compose :

```bash
cd /opt/climbcrew/frontend
npm install
npm run build
```

Si `npm` n'est pas installé sur le serveur :

```bash
sudo apt install -y nodejs npm
```

### 6.3 Démarrer les conteneurs

```bash
cd /opt/climbcrew
docker compose -f docker-compose.https.yml up --build -d
```

Vérifiez :

```bash
docker ps
curl -k https://localhost:8443
curl -k https://localhost:8443/api/auth/me
```

La route API doit répondre :

```json
{"error":"Authentification requise"}
```

C'est normal : cela signifie que l'API est joignable et qu'elle refuse l'accès sans session.

### 6.4 Accès de test

En test local Ubuntu, l'application est disponible sur :

```text
https://IP_DU_SERVEUR:8443
```

Compte de test local :

```text
admin@test.local
admin
```

> Ce compte ne doit pas être conservé en production publique.

---

## 7. Production réelle : points obligatoires avant ouverture publique

Avant de publier l'application sur Internet, il faut créer une configuration production dédiée.

À prévoir dans le dépôt :

```text
docker-compose.prod.yml
nginx/prod.conf
.env.prod.example
.github/workflows/deploy-ubuntu.yml
.github/scripts/deploy-ubuntu.sh
```

Différences attendues par rapport au local :

```text
- ports 80 et 443 au lieu de 8080 et 8443 ;
- vrai nom de domaine au lieu de localhost ;
- certificat Let's Encrypt ;
- variables sensibles dans un fichier .env non versionné ;
- DEV_ADMIN_ENABLED=false ;
- mot de passe PostgreSQL fort ;
- secret de session fort ;
- sauvegarde PostgreSQL planifiée ;
- logs et supervision minimum.
```

Exemple de variables à prévoir dans un futur `.env.prod` :

```env
NODE_ENV=production
PORT=3000
POSTGRES_DB=climbcrew
POSTGRES_USER=climbcrew
POSTGRES_PASSWORD=REMPLACER_PAR_UN_MOT_DE_PASSE_FORT
DATABASE_URL=postgres://climbcrew:REMPLACER_PAR_UN_MOT_DE_PASSE_FORT@db:5432/climbcrew
PG_SSL=false
TRUST_PROXY=1
CORS_ORIGIN=https://votre-domaine.fr
SECURE_COOKIES=true
COOKIE_SAMESITE=lax
SESSION_COOKIE_NAME=climbcrew_session
DEV_ADMIN_ENABLED=false
FIRST_ADMIN_EMAIL=admin@votre-domaine.fr
FIRST_ADMIN_PASSWORD=REMPLACER_PAR_UN_MOT_DE_PASSE_FORT
ALLOW_WEAK_FIRST_ADMIN_PASSWORD=false
BCRYPT_ROUNDS=12
AUTO_IMPORT_DATA=false
MAX_JSON_BODY_SIZE=10mb
```

Ne jamais versionner le fichier `.env.prod` réel.

---

## 8. Certificat HTTPS réel avec Let's Encrypt

Pour la production, utilisez un vrai nom de domaine, par exemple :

```text
climbcrew.votre-domaine.fr
```

Le DNS doit pointer vers l'adresse IP publique du serveur Ubuntu.

Deux approches sont possibles :

1. **Certbot installé sur l'hôte Ubuntu**, avec nginx sur l'hôte ;
2. **reverse proxy Docker dédié**, par exemple Traefik ou nginx-proxy avec renouvellement automatique.

La méthode sera finalisée avec le fichier `docker-compose.prod.yml`.

---

## 9. Installation du GitHub runner sur Ubuntu

Le runner permet de déployer automatiquement le serveur Ubuntu après chaque `git push` sur `main`.

Sur GitHub :

```text
Repository ClimbCrew
Settings
Actions
Runners
New self-hosted runner
Linux
x64
```

GitHub affiche des commandes personnalisées. Exécutez-les sur le serveur Ubuntu.

Labels recommandés :

```text
self-hosted
linux
climbcrew-prod
```

Le futur workflow Ubuntu devra utiliser :

```yaml
runs-on: [self-hosted, linux, climbcrew-prod]
```

Après configuration du runner, installez-le comme service avec les commandes données par GitHub, généralement :

```bash
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

---

## 10. Déploiement manuel provisoire sur Ubuntu

Tant que le workflow Linux de production n'est pas créé, la mise à jour manuelle se fait ainsi :

```bash
cd /opt/climbcrew

git pull

cd frontend
npm install
npm run build

cd /opt/climbcrew
docker compose -f docker-compose.https.yml up --build -d
```

Vérification :

```bash
docker ps
curl -k https://localhost:8443/api/auth/me
```

Logs utiles :

```bash
docker logs climbcrew-nginx-local --tail=100
docker logs climbcrew-backend-local --tail=100
docker logs climbcrew-db-local --tail=100
```

---

## 11. Sauvegarde PostgreSQL

Avant toute mise à jour importante, faire une sauvegarde :

```bash
cd /opt/climbcrew
mkdir -p backups

docker exec climbcrew-db-local pg_dump -U app app_local > backups/climbcrew_$(date +%Y%m%d_%H%M%S).sql
```

Restaurer une sauvegarde :

```bash
cat backups/NOM_DU_FICHIER.sql | docker exec -i climbcrew-db-local psql -U app app_local
```

En production, les noms `app` et `app_local` devront être remplacés par les valeurs définies dans `.env.prod`.

---

## 12. Commandes utiles

Afficher les conteneurs :

```bash
docker ps
```

Redémarrer :

```bash
cd /opt/climbcrew
docker compose -f docker-compose.https.yml restart
```

Arrêter :

```bash
cd /opt/climbcrew
docker compose -f docker-compose.https.yml down
```

Relancer avec rebuild :

```bash
cd /opt/climbcrew
docker compose -f docker-compose.https.yml up --build -d
```

Afficher les logs backend :

```bash
docker logs climbcrew-backend-local --tail=100 -f
```

Afficher les logs nginx :

```bash
docker logs climbcrew-nginx-local --tail=100 -f
```

Afficher les volumes Docker :

```bash
docker volume ls
```

---

## 13. Checklist production avant mise en ligne

```text
[ ] Serveur Ubuntu à jour
[ ] Docker Engine installé
[ ] Dépôt cloné dans /opt/climbcrew
[ ] Nom de domaine configuré
[ ] Ports 80/443 ouverts
[ ] docker-compose.prod.yml créé
[ ] nginx/prod.conf créé
[ ] .env.prod créé sur le serveur mais non versionné
[ ] DEV_ADMIN_ENABLED=false
[ ] mots de passe forts générés
[ ] certificat HTTPS réel installé
[ ] sauvegarde PostgreSQL testée
[ ] runner GitHub Linux installé comme service
[ ] workflow deploy-ubuntu.yml opérationnel
[ ] test login admin OK
```

---

## 14. Important sécurité

Ne jamais mettre dans GitHub :

```text
.env
.env.prod
certs/
nginx/certs/
backups/
*.sql
mots de passe
exports de données réelles
```

GitHub doit contenir le code et les modèles de configuration. Le serveur Ubuntu doit conserver localement les secrets, les certificats et les données PostgreSQL.
