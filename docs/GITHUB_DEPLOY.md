# Publication GitHub et synchronisation serveur local

## Objectif

Le dépôt GitHub devient la source officielle du code ClimbCrew.
À chaque push sur `main`, un runner GitHub Actions installé sur le PC serveur peut relancer automatiquement le serveur local HTTPS.

Architecture :

```text
VS Code Windows
  -> git commit / git push
  -> GitHub main
  -> GitHub Actions self-hosted runner sur le PC serveur
  -> C:\Serveurs\ClimbCrew
  -> Docker Compose
  -> https://localhost:8443
```

## Important sécurité

Ne jamais commiter :

```text
.env
certs/
nginx/certs/
backend/import-data.json
*.private.json
```

Les données réelles du club doivent rester sur le serveur local ou dans PostgreSQL, pas dans GitHub.

## Remplacer complètement le dépôt GitHub

Depuis le dossier local contenant le code :

```powershell
cd C:\Users\alext\Desktop\ClimbCrew
powershell -ExecutionPolicy Bypass -File .\scripts\replace-github-main.ps1
```

Ce script publie le dossier courant vers :

```text
https://github.com/fabienkazak-maker/ClimbCrew
```

Il utilise `git push --force-with-lease` pour remplacer la branche `main` distante tout en évitant d'écraser un changement distant non récupéré.

## Synchronisation automatique du serveur local

### 1. Installer le self-hosted runner

Dans GitHub :

```text
Repository ClimbCrew
> Settings
> Actions
> Runners
> New self-hosted runner
> Windows x64
```

Crée le dossier recommandé :

```powershell
mkdir C:\actions-runner
cd C:\actions-runner
```

Puis copie-colle les commandes affichées par GitHub.

Le runner peut être lancé manuellement avec :

```powershell
.\run.cmd
```

ou installé comme service Windows avec les commandes indiquées par GitHub.

### 2. Préparer le dossier serveur

Le workflow déploie par défaut dans :

```text
C:\Serveurs\ClimbCrew
```

Pour changer ce dossier, définis une variable d'environnement système ou utilisateur :

```powershell
[Environment]::SetEnvironmentVariable("CLIMBCREW_DEPLOY_PATH", "D:\Serveurs\ClimbCrew", "User")
```

### 3. Premier certificat local

Après le premier déploiement automatique, sur le PC serveur :

```powershell
cd C:\Serveurs\ClimbCrew
powershell -ExecutionPolicy Bypass -File .\trust-local-certificate.ps1
```

### 4. Utilisation quotidienne

Ensuite :

```powershell
git add -A
git commit -m "Modification ClimbCrew"
git push
```

GitHub Actions déclenche le déploiement automatiquement.

## Synchronisation manuelle sans runner

Sur le serveur local :

```powershell
cd C:\Users\alext\Desktop\ClimbCrew
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-from-github-local.ps1
```

## Vérification

```powershell
docker ps
curl.exe -k https://localhost:8443/api/auth/me
```

Résultat attendu sans session connectée : une erreur d'authentification JSON, pas un 502 nginx.
