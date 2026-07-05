Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$deployPath = $env:CLIMBCREW_DEPLOY_PATH
if ([string]::IsNullOrWhiteSpace($deployPath)) {
  $deployPath = "C:\Serveurs\ClimbCrew"
}

$sourcePath = $env:GITHUB_WORKSPACE
if ([string]::IsNullOrWhiteSpace($sourcePath) -or !(Test-Path $sourcePath)) {
  throw "GITHUB_WORKSPACE introuvable. Ce script doit être lancé par GitHub Actions."
}

Write-Host "=== Déploiement ClimbCrew depuis GitHub ==="
Write-Host "Source : $sourcePath"
Write-Host "Cible  : $deployPath"

New-Item -ItemType Directory -Force -Path $deployPath | Out-Null

Write-Host "=== Synchronisation du code ==="
# On conserve volontairement les données privées, certificats et builds locaux hors Git.
robocopy $sourcePath $deployPath /MIR `
  /XD .git .github\_temp node_modules dist .tmp certs nginx\certs .vscode .idea `
  /XF .env .env.local import-data.json *.private.json *.secret *.zip *.log | Out-Host

if ($LASTEXITCODE -gt 7) {
  throw "Erreur Robocopy pendant la synchronisation. Code : $LASTEXITCODE"
}
$global:LASTEXITCODE = 0

Set-Location $deployPath

Write-Host "=== Vérification Docker ==="
$dockerReady = $false
for ($i = 1; $i -le 60; $i++) {
  docker info *> $null
  if ($LASTEXITCODE -eq 0) {
    $dockerReady = $true
    break
  }
  Write-Host "Docker pas encore prêt ($i/60)..."
  Start-Sleep -Seconds 2
}

if (!$dockerReady) {
  throw "Docker ne répond pas. Vérifie que Docker Desktop est lancé sur le serveur local."
}

Write-Host "=== Certificat local ==="
if (!(Test-Path ".\certs\localhost.crt") -or !(Test-Path ".\certs\localhost.key")) {
  powershell -ExecutionPolicy Bypass -File .\create-local-certificate.ps1
} else {
  Write-Host "Certificat local déjà présent."
}

Write-Host "=== Build et relance du serveur HTTPS ==="
powershell -ExecutionPolicy Bypass -File .\start-server-https.ps1

Write-Host "=== Vérification HTTPS ==="
try {
  powershell -ExecutionPolicy Bypass -File .\verify-local-https.ps1
} catch {
  Write-Host "La vérification intégrée a échoué. Affichage des conteneurs et logs utiles."
  docker ps
  docker logs climbcrew-nginx-local --tail=80
  docker logs climbcrew-backend-local --tail=80
  throw
}

Write-Host "Déploiement terminé : https://localhost:8443"
