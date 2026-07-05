Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "=== Mise à jour locale depuis GitHub ==="
git fetch origin main
git reset --hard origin/main

Write-Host "=== Relance serveur HTTPS ==="
powershell -ExecutionPolicy Bypass -File .\start-server-https.ps1
powershell -ExecutionPolicy Bypass -File .\verify-local-https.ps1
