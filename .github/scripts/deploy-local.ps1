Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Chemin cible du serveur local.
# Peut etre surcharge par la variable d'environnement CLIMBCREW_DEPLOY_PATH.
$deployPath = $env:CLIMBCREW_DEPLOY_PATH
if ([string]::IsNullOrWhiteSpace($deployPath)) {
  $deployPath = "C:\Serveurs\ClimbCrew"
}

# Chemin source.
# En GitHub Actions, GITHUB_WORKSPACE est fourni automatiquement.
# En lancement manuel, on remonte depuis .github\scripts vers la racine du depot.
$sourcePath = $env:GITHUB_WORKSPACE
if ([string]::IsNullOrWhiteSpace($sourcePath) -or !(Test-Path $sourcePath)) {
  $sourcePath = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}

if (!(Test-Path $sourcePath)) {
  throw "Source introuvable : $sourcePath"
}

if ($sourcePath -eq $deployPath) {
  throw "Le chemin source et le chemin cible sont identiques. Deploiement refuse."
}

Write-Host "=== Deploiement ClimbCrew ==="
Write-Host "Source : $sourcePath"
Write-Host "Cible  : $deployPath"

New-Item -ItemType Directory -Force -Path $deployPath | Out-Null

Write-Host "=== Synchronisation du code ==="

robocopy $sourcePath $deployPath /MIR `
  /XD .git node_modules dist .tmp certs nginx\certs .vscode .idea `
  /XF .env .env.local import-data.json *.private.json *.secret *.zip *.log | Out-Host

if ($LASTEXITCODE -gt 7) {
  throw "Erreur Robocopy pendant la synchronisation. Code : $LASTEXITCODE"
}

$global:LASTEXITCODE = 0

Set-Location $deployPath

Write-Host "=== Verification Docker ==="

$dockerReady = $false

for ($i = 1; $i -le 60; $i++) {
  docker info *> $null

  if ($LASTEXITCODE -eq 0) {
    $dockerReady = $true
    break
  }

  Write-Host "Docker pas encore pret ($i/60)..."
  Start-Sleep -Seconds 2
}

if (!$dockerReady) {
  throw "Docker ne repond pas. Verifie que Docker Desktop est lance."
}

Write-Host "=== Certificat local ==="

if (!(Test-Path ".\certs\localhost.crt") -or !(Test-Path ".\certs\localhost.key")) {
  powershell -ExecutionPolicy Bypass -File .\create-local-certificate.ps1
} else {
  Write-Host "Certificat local deja present."
}

Write-Host "=== Build et relance du serveur HTTPS ==="

powershell -ExecutionPolicy Bypass -File .\start-server-https.ps1

Write-Host "=== Verification HTTPS ==="

try {
  powershell -ExecutionPolicy Bypass -File .\verify-local-https.ps1
} catch {
  Write-Host "La verification integree a echoue."
  Write-Host "Affichage des conteneurs et logs utiles."

  docker ps
  docker logs climbcrew-nginx-local --tail=80
  docker logs climbcrew-backend-local --tail=80

  throw
}

Write-Host "Deploiement termine : https://localhost:8443"
