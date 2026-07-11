# ClimbCrew — installation locale et serveur Linux

ClimbCrew est une application de gestion pour un club d’escalade.

Elle permet notamment de gérer :

* les inscriptions aux séances ;
* les participants ;
* les cordes et les voies ;
* les réalisations ;
* la progression ;
* les comptes utilisateurs ;
* l’administration du club.

Le projet peut être utilisé dans deux contextes :

* **en local Windows**, pour le développement et les tests ;
* **sur un serveur Linux**, derrière un reverse proxy HTTPS qui porte le certificat SSL/TLS.

---

## 1. Architecture générale

### 1.1. Développement local

En local, l’application peut être lancée avec Docker Desktop.

```text
Navigateur
   ↓
Frontend React / Vite
   ↓
Backend Node / Express
   ↓
PostgreSQL
```

### 1.2. Serveur Linux de production

En production, l’application est prévue pour fonctionner derrière un reverse proxy.

```text
Internet
   ↓
https://climbcrew.dip-tcs.com
   ↓
Reverse proxy HTTPS du serveur
   ↓
Frontend local : http://127.0.0.1:8080
Backend API local : http://127.0.0.1:3000
   ↓
PostgreSQL Docker interne
```

Le certificat HTTPS n’est **pas géré par l’application ClimbCrew**.

Il est porté par le reverse proxy du serveur, par exemple :

* Nginx ;
* Apache ;
* Traefik ;
* Caddy ;
* un reverse proxy déjà administré par l’hébergeur.

---

## 2. Compte de test local

Un compte administrateur de test peut être utilisé en développement local :

```text
Email        : admin@test.local
Mot de passe : admin
```

Ce compte est réservé au développement local.

En production, il faut définir un mot de passe fort dans le fichier `.env.production`.

---

## 3. Prérequis pour installation locale Windows

À installer sur le poste Windows :

* Docker Desktop ;
* Git for Windows ;
* PowerShell ;
* un navigateur récent, par exemple Chrome ou Edge ;
* VS Code, optionnel mais recommandé.

Docker Desktop doit être démarré avant de lancer l’application.

---

## 4. Installation locale Windows

Depuis PowerShell :

```powershell
cd C:\Users\[YourUsername]\Desktop
git clone https://github.com/fabienkazak-maker/ClimbCrew.git
cd ClimbCrew
```

---

## 5. Lancement local en mode développement

Pour lancer le mode développement :

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

Ouvrir ensuite :

```text
http://localhost:5173
```

Pour arrêter :

```powershell
powershell -ExecutionPolicy Bypass -File .\stop-dev.ps1
```

---

## 6. Lancement local HTTPS

Créer le certificat local :

```powershell
powershell -ExecutionPolicy Bypass -File .\create-local-certificate.ps1
```

Ajouter le certificat dans le magasin de certificats Windows :

```powershell
powershell -ExecutionPolicy Bypass -File .\trust-local-certificate.ps1
```

Lancer le serveur local HTTPS :

```powershell
powershell -ExecutionPolicy Bypass -File .\start-server-https.ps1
```

Ouvrir :

```text
https://localhost:8443
```

Le port HTTP local suivant redirige vers HTTPS :

```text
http://localhost:8080
```

---

## 7. Vérification locale

Dans une deuxième fenêtre PowerShell :

```powershell
powershell -ExecutionPolicy Bypass -File .\verify-local-https.ps1
```

Le résultat attendu :

* nginx est démarré ;
* le backend est démarré ;
* PostgreSQL est healthy ;
* la page HTTPS répond ;
* l’API répond ;
* le login admin fonctionne.

---

# Installation sur serveur Linux

## 8. Principe de déploiement serveur

Sur le serveur Linux, ClimbCrew est lancé en HTTP local.

Le reverse proxy du serveur est responsable :

* de l’exposition publique du domaine ;
* du certificat HTTPS ;
* du renouvellement du certificat ;
* de la redirection HTTP vers HTTPS ;
* du routage vers le frontend et le backend.

L’application ne doit pas écouter directement sur le port `443`.

---

## 9. Prérequis serveur Linux

Le serveur doit disposer de :

* Linux, par exemple Debian ou Ubuntu ;
* Git ;
* Docker Engine ;
* Docker Compose plugin ;
* un reverse proxy configuré par le responsable serveur ;
* un domaine pointant vers le serveur, par exemple :

```text
climbcrew.dip-tcs.com
```

Vérifier Docker :

```bash
docker --version
docker compose version
```

---

## 10. Récupération du projet sur le serveur

Exemple d’installation dans `/opt/climbcrew` :

```bash
sudo mkdir -p /opt/climbcrew
sudo chown -R "$USER":"$USER" /opt/climbcrew
cd /opt/climbcrew

git clone https://github.com/fabienkazak-maker/ClimbCrew.git .
```

Si le dépôt existe déjà :

```bash
cd /opt/climbcrew
git pull origin main
```

---

## 11. Fichier de configuration production

Le fichier réel `.env.production` ne doit jamais être committé dans GitHub.

Copier le modèle :

```bash
cp .env.production.example .env.production
```

Éditer le fichier :

```bash
nano .env.production
```

Exemple de contenu :

```env
# Domaine public exposé par le reverse proxy HTTPS
PUBLIC_URL=https://climbcrew.dip-tcs.com
FRONTEND_ORIGIN=https://climbcrew.dip-tcs.com
CORS_ORIGIN=https://climbcrew.dip-tcs.com

# Mode applicatif
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
TRUST_PROXY=1

# Cookies
SECURE_COOKIES=true
COOKIE_SAMESITE=lax
SESSION_COOKIE_NAME=climbcrew_session
CSRF_COOKIE_NAME=climbcrew_csrf
SESSION_DURATION_DAYS=7

# PostgreSQL Docker
POSTGRES_DB=climbcrew
POSTGRES_USER=climbcrew
POSTGRES_PASSWORD=CHANGE_ME_LONG_RANDOM_PASSWORD
DATABASE_URL=postgres://climbcrew:CHANGE_ME_LONG_RANDOM_PASSWORD@db:5432/climbcrew
PG_SSL=false
PG_SSL_REJECT_UNAUTHORIZED=true

# Maintenance / initialisation
SETUP_TOKEN=CHANGE_ME_LONG_RANDOM_SETUP_TOKEN

# Premier administrateur
FIRST_ADMIN_EMAIL=admin@test.local
FIRST_ADMIN_PASSWORD=CHANGE_ME_StrongPassword_2026!
ALLOW_WEAK_FIRST_ADMIN_PASSWORD=false
BCRYPT_ROUNDS=12

# Frontend Vite
VITE_API_URL=/api

# Limites applicatives
MAX_JSON_BODY_SIZE=10mb
WRITE_RATE_LIMIT_PER_MINUTE=120

# Ports locaux exposés uniquement sur 127.0.0.1
BACKEND_BIND_PORT=3000
FRONTEND_BIND_PORT=8080
```

---

## 12. Générer les secrets de production

Générer un mot de passe PostgreSQL robuste :

```bash
openssl rand -base64 32
```

Générer un token de maintenance :

```bash
openssl rand -hex 32
```

Remplacer dans `.env.production` :

```env
POSTGRES_PASSWORD=...
DATABASE_URL=postgres://climbcrew:...@db:5432/climbcrew
SETUP_TOKEN=...
```

Le mot de passe du premier administrateur doit être robuste :

```env
FIRST_ADMIN_PASSWORD=...
```

Il doit respecter la règle suivante :

* au moins 12 caractères ;
* une majuscule ;
* une minuscule ;
* un chiffre ;
* un caractère spécial.

---

## 13. Lancement avec Docker Compose

Depuis la racine du projet :

```bash
cd /opt/climbcrew
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Vérifier les conteneurs :

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Les conteneurs attendus sont :

```text
climbcrew-db
climbcrew-backend
climbcrew-frontend
```

---

## 14. Ports locaux utilisés

Par défaut :

```text
Frontend : http://127.0.0.1:8080
Backend  : http://127.0.0.1:3000
```

Ces ports sont exposés uniquement en local sur le serveur.

Ils ne doivent pas être exposés directement à Internet.

---

## 15. Configuration reverse proxy Nginx

Exemple de configuration Nginx côté serveur hôte :

```nginx
server {
    listen 80;
    server_name climbcrew.dip-tcs.com;

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name climbcrew.dip-tcs.com;

    ssl_certificate     /etc/letsencrypt/live/climbcrew.dip-tcs.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/climbcrew.dip-tcs.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    client_max_body_size 10m;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $host;

        proxy_set_header Cookie $http_cookie;
        proxy_set_header X-CSRF-Token $http_x_csrf_token;

        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $host;
    }
}
```

Un exemple est également disponible dans :

```text
deploy/nginx/climbcrew.reverse-proxy.example.conf
```

---

## 16. Initialisation de la base

Une fois les conteneurs lancés et le reverse proxy configuré, initialiser la base :

```bash
cd /opt/climbcrew
bash deploy/scripts/setup-db.sh .env.production
```

Cette commande appelle :

```text
https://climbcrew.dip-tcs.com/api/setup-db
```

avec l’en-tête :

```text
X-Setup-Token
```

Le token utilisé est celui défini dans `.env.production`.

---

## 17. Vérification de santé

Tester via le script fourni :

```bash
cd /opt/climbcrew
bash deploy/scripts/healthcheck.sh .env.production
```

Tester manuellement le backend local :

```bash
curl http://127.0.0.1:3000/health
```

Tester via le domaine public :

```bash
curl https://climbcrew.dip-tcs.com/api/health
```

Réponse attendue :

```json
{
  "ok": true
}
```

---

## 18. Connexion à l’application

Ouvrir dans le navigateur :

```text
https://climbcrew.dip-tcs.com
```

Se connecter avec le premier compte administrateur défini dans `.env.production`.

Exemple :

```text
Email : admin@test.local
Mot de passe : valeur de FIRST_ADMIN_PASSWORD
```

En production, ne pas utiliser le mot de passe local `admin`.

---

## 19. Commandes d’exploitation serveur

Voir les conteneurs :

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Voir les logs backend :

```bash
docker logs climbcrew-backend --tail=200
```

Voir les logs frontend :

```bash
docker logs climbcrew-frontend --tail=200
```

Voir les logs PostgreSQL :

```bash
docker logs climbcrew-db --tail=200
```

Redémarrer l’application :

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml restart
```

Arrêter l’application :

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml down
```

Relancer après mise à jour GitHub :

```bash
cd /opt/climbcrew
git pull origin main
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

---

## 20. Sauvegarde PostgreSQL

Créer une sauvegarde :

```bash
docker exec climbcrew-db pg_dump -U climbcrew climbcrew > climbcrew_backup.sql
```

Restaurer une sauvegarde :

```bash
cat climbcrew_backup.sql | docker exec -i climbcrew-db psql -U climbcrew -d climbcrew
```

---

## 21. Mise à jour applicative

Procédure recommandée :

```bash
cd /opt/climbcrew
git pull origin main
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
bash deploy/scripts/healthcheck.sh .env.production
```

---

## 22. Sécurité

Points importants :

* ne jamais committer `.env.production` ;
* ne jamais mettre de mot de passe réel dans GitHub ;
* ne pas exposer directement le backend Node sur Internet ;
* garder les ports `3000` et `8080` liés à `127.0.0.1` ;
* laisser le reverse proxy gérer le certificat HTTPS ;
* utiliser `SECURE_COOKIES=true` en production ;
* utiliser un `SETUP_TOKEN` long et aléatoire ;
* utiliser un mot de passe administrateur robuste ;
* ne pas utiliser le mot de passe local `admin` en production.

---

## 23. Structure utile du projet

```text
ClimbCrew/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── Dockerfile.prod
│
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── Dockerfile.prod
│   └── nginx.prod.conf
│
├── deploy/
│   ├── README-linux-reverse-proxy.md
│   ├── nginx/
│   │   └── climbcrew.reverse-proxy.example.conf
│   ├── scripts/
│   │   ├── deploy-docker.sh
│   │   ├── setup-db.sh
│   │   └── healthcheck.sh
│   └── systemd/
│       └── climbcrew-backend.service
│
├── docker-compose.prod.yml
├── .env.production.example
└── README.md
```

---

## 24. Dépannage

### Le site affiche encore la page par défaut nginx

Le domaine pointe bien vers le serveur, mais le reverse proxy ne redirige pas encore vers ClimbCrew.

Vérifier la configuration Nginx :

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### L’API ne répond pas

Tester le backend local :

```bash
curl http://127.0.0.1:3000/health
```

Puis consulter les logs :

```bash
docker logs climbcrew-backend --tail=200
```

### Erreur CORS

Vérifier dans `.env.production` :

```env
PUBLIC_URL=https://climbcrew.dip-tcs.com
FRONTEND_ORIGIN=https://climbcrew.dip-tcs.com
CORS_ORIGIN=https://climbcrew.dip-tcs.com
```

Puis relancer :

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

### Problème de cookie ou de session

Vérifier :

```env
SECURE_COOKIES=true
COOKIE_SAMESITE=lax
TRUST_PROXY=1
```

Le reverse proxy doit transmettre :

```nginx
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Forwarded-Host $host;
```

### Erreur PostgreSQL

Vérifier les logs :

```bash
docker logs climbcrew-db --tail=200
```

Vérifier que le mot de passe est identique dans :

```env
POSTGRES_PASSWORD=...
DATABASE_URL=postgres://climbcrew:...@db:5432/climbcrew
```

### Réinitialiser complètement la base

Attention, cette commande supprime les données PostgreSQL Docker.

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml down -v
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
bash deploy/scripts/setup-db.sh .env.production
```

---

## 25. Résumé rapide installation Linux

```bash
sudo mkdir -p /opt/climbcrew
sudo chown -R "$USER":"$USER" /opt/climbcrew
cd /opt/climbcrew

git clone https://github.com/fabienkazak-maker/ClimbCrew.git .

cp .env.production.example .env.production
nano .env.production

docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

bash deploy/scripts/setup-db.sh .env.production
bash deploy/scripts/healthcheck.sh .env.production
```

Puis ouvrir :

```text
https://climbcrew.dip-tcs.com
```
