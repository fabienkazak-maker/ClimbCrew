Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (!(Test-Path ".\certs\localhost.crt") -or !(Test-Path ".\certs\localhost.key")) {
  Write-Host "Certificat HTTPS local absent. Génération..."
  powershell -ExecutionPolicy Bypass -File .\create-local-certificate.ps1
}

Write-Host "=== Nettoyage des résidus frontend ==="
Remove-Item -Recurse -Force .\frontend\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\frontend\dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\.tmp\frontend-build -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path .\.tmp\frontend-build | Out-Null

Write-Host "=== Préparation d'un contexte de build frontend isolé ==="
robocopy .\frontend .\.tmp\frontend-build /MIR /XD node_modules dist .git /XF npm-debug.log .env.local | Out-Host
if ($LASTEXITCODE -gt 7) {
  throw "Erreur robocopy pendant la préparation du frontend. Code : $LASTEXITCODE"
}
$global:LASTEXITCODE = 0

Write-Host "=== Build frontend production ==="
docker run --rm `
  -v "${PWD}\.tmp\frontend-build:/app" `
  -w /app `
  node:20-bookworm-slim `
  sh -lc "npm install -g npm@11.18.0 && npm install --no-audit --no-fund && npm run build"

if ($LASTEXITCODE -ne 0) {
  throw "Erreur pendant le build frontend. Code : $LASTEXITCODE"
}

if (!(Test-Path ".\.tmp\frontend-build\dist")) {
  throw "Le build frontend n'a pas produit le dossier dist."
}

Write-Host "=== Publication du frontend compilé ==="
New-Item -ItemType Directory -Force -Path .\frontend\dist | Out-Null
robocopy .\.tmp\frontend-build\dist .\frontend\dist /MIR | Out-Host
if ($LASTEXITCODE -gt 7) {
  throw "Erreur robocopy pendant la publication du frontend. Code : $LASTEXITCODE"
}
$global:LASTEXITCODE = 0

Write-Host "=== Relance serveur local HTTPS ==="
docker compose -f docker-compose.server.yml down --remove-orphans
docker compose -f docker-compose.server.yml up --build -d --remove-orphans

if ($LASTEXITCODE -ne 0) {
  throw "Erreur pendant le lancement Docker Compose HTTPS. Code : $LASTEXITCODE"
}

Write-Host ""
Write-Host "Serveur local HTTPS disponible sur : https://localhost:8443"
Write-Host "Redirection HTTP disponible sur       : http://localhost:8080"
Write-Host ""
Write-Host "Si le navigateur affiche un avertissement certificat :"
Write-Host "powershell -ExecutionPolicy Bypass -File .\trust-local-certificate.ps1"
