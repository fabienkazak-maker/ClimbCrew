Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host "=== ClimbCrew - lancement environnement développement ==="
docker compose -f docker-compose.dev.yml up --build
