# ClimbCrew — installation locale Windows + Docker

Ce projet permet de lancer ClimbCrew sur un PC Windows avec Docker Desktop.

Deux modes sont disponibles :

- **Développement** : `http://localhost:5173`
- **Serveur local HTTPS** : `https://localhost:8443`

Compte local de test :

```text
Email       : admin@test.local
Mot de passe: admin
```

Ce compte est prévu uniquement pour le développement local.

---

## 1. Prérequis

À installer sur le PC Windows :

- Docker Desktop
- Git for Windows, utilisé aussi pour OpenSSL
- PowerShell
- Un navigateur récent : Edge ou Chrome
- VS Code, optionnel mais recommandé

Docker Desktop doit être démarré avant de lancer l'application.

---

## 2. Installation du projet

Dézipper le projet sur le Bureau Windows pour obtenir :

```text
C:\Users\[YourUsername]\Desktop\ClimbCrew
```

Ouvrir PowerShell, puis aller dans le dossier projet :

```powershell
cd C:\Users\[YourUsername]\Desktop\ClimbCrew
```

---

## 3. Lancement recommandé en HTTPS

Créer le certificat local :

```powershell
powershell -ExecutionPolicy Bypass -File .\create-local-certificate.ps1
```

Ajouter le certificat dans le magasin de certificats de l'utilisateur Windows :

```powershell
powershell -ExecutionPolicy Bypass -File .\trust-local-certificate.ps1
```

Lancer le serveur local HTTPS :

```powershell
powershell -ExecutionPolicy Bypass -File .\start-server-https.ps1
```

Ouvrir ensuite :

```text
https://localhost:8443
```

Le port HTTP suivant redirige vers HTTPS :

```text
http://localhost:8080
```

Ne pas utiliser `https://localhost:5173` : le port `5173` est réservé au mode développement HTTP.

---

## 4. Vérification après lancement

Dans une deuxième fenêtre PowerShell :

```powershell
cd C:\Users\[YourUsername]\Desktop\ClimbCrew
powershell -ExecutionPolicy Bypass -File .\verify-local-https.ps1
```

Le résultat attendu :

- nginx est démarré ;
- le backend est démarré ;
- PostgreSQL est healthy ;
- la page HTTPS répond en HTTP 200 ;
- l'API répond ;
- le login admin fonctionne.

---

## 5. Lancement en mode développement

Pour travailler avec le serveur Vite et le rechargement rapide :

```powershell
cd C:\Users\[YourUsername]\Desktop\ClimbCrew
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

Ouvrir :

```text
http://localhost:5173
```

Arrêter le mode développement :

```powershell
powershell -ExecutionPolicy Bypass -File .\stop-dev.ps1
```

---

## 6. Réinitialiser les données locales

Cette commande supprime la base de développement locale et réimporte les données legacy :

```powershell
cd C:\Users\[YourUsername]\Desktop\ClimbCrew
powershell -ExecutionPolicy Bypass -File .\reset-dev-with-legacy-data.ps1
```

Elle recharge notamment :

- les participants ;
- les séances ;
- les cordes ;
- les voies ;
- les couleurs de passeports ;
- les couleurs de cordes ;
- les couleurs de prises.

---

## 7. Commandes utiles

Voir les conteneurs actifs :

```powershell
docker ps
```

Voir les logs du backend HTTPS :

```powershell
docker logs climbcrew-backend-local --tail=150
```

Voir les logs nginx HTTPS :

```powershell
docker logs climbcrew-nginx-local --tail=150
```

Arrêter le serveur HTTPS :

```powershell
docker compose -f docker-compose.https.yml down --remove-orphans
```

Arrêter le développement :

```powershell
docker compose -f docker-compose.dev.yml down --remove-orphans
```

Supprimer aussi les volumes de base de données locale :

```powershell
docker compose -f docker-compose.https.yml down -v --remove-orphans
docker compose -f docker-compose.dev.yml down -v --remove-orphans
```

---

## 8. Tests API rapides

Tester l'accès API via HTTPS :

```powershell
curl.exe -k https://localhost:8443/api/auth/me
```

Sans session connectée, une réponse d'authentification requise est normale.

Tester le login admin :

```powershell
$body = @{ email = "admin@test.local"; password = "admin" } | ConvertTo-Json -Compress
Invoke-RestMethod -Uri "https://localhost:8443/api/auth/login" -Method Post -ContentType "application/json" -Body $body -SkipCertificateCheck
```

Si `-SkipCertificateCheck` n'est pas reconnu par ta version de PowerShell, utiliser :

```powershell
curl.exe -k -X POST "https://localhost:8443/api/auth/login" -H "Content-Type: application/json" --data-raw '{"email":"admin@test.local","password":"admin"}'
```

---

## 9. Structure du projet

```text
ClimbCrew/
├── backend/                  API Node/Express + PostgreSQL
├── frontend/                 Interface React/Vite
├── nginx/                    Configuration reverse proxy HTTPS
├── docs/imports/             Données legacy importées
├── docker-compose.dev.yml    Environnement développement
├── docker-compose.https.yml  Serveur local HTTPS
├── create-local-certificate.ps1
├── trust-local-certificate.ps1
├── start-dev.ps1
├── start-server-https.ps1
└── verify-local-https.ps1
```

---

## 10. Notes de sécurité locale

- Le mot de passe `admin` est réservé au développement local.
- Avant un vrai déploiement public, il faut changer les secrets, désactiver l'admin local et utiliser un vrai certificat TLS.
- Les certificats générés ici sont des certificats locaux auto-signés pour `localhost`.
- Les cookies de session sont configurés en mode sécurisé sur le serveur HTTPS local.

---

## 11. Problèmes fréquents

### Le navigateur affiche `ERR_CONNECTION_REFUSED`

Vérifier que nginx tourne :

```powershell
docker ps
```

Le conteneur `climbcrew-nginx-local` doit être en `Up`.

### nginx redémarre en boucle

Afficher les logs :

```powershell
docker logs climbcrew-nginx-local --tail=150
```

Puis régénérer le certificat :

```powershell
powershell -ExecutionPolicy Bypass -File .\create-local-certificate.ps1
powershell -ExecutionPolicy Bypass -File .\start-server-https.ps1
```

### Erreur de connexion PostgreSQL

Supprimer le volume local puis relancer :

```powershell
docker compose -f docker-compose.https.yml down -v --remove-orphans
powershell -ExecutionPolicy Bypass -File .\start-server-https.ps1
```

### Page blanche ou ancien frontend

Relancer le build HTTPS :

```powershell
powershell -ExecutionPolicy Bypass -File .\start-server-https.ps1
```

## Publication GitHub et synchronisation serveur

Pour remplacer complètement le dépôt GitHub `fabienkazak-maker/ClimbCrew` par ce code :

```powershell
cd C:\Users\[YourUsername]\Desktop\ClimbCrew
powershell -ExecutionPolicy Bypass -File .\scripts\replace-github-main.ps1
```

Pour synchroniser automatiquement le serveur local avec GitHub, installe un GitHub Actions self-hosted runner sur le PC serveur. Le workflow est déjà présent dans :

```text
.github/workflows/deploy-local.yml
```

La procédure complète est dans :

```text
docs/GITHUB_DEPLOY.md
```
