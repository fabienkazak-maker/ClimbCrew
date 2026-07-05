Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host "=== ClimbCrew - arrêt environnement développement ==="
docker compose -f docker-compose.dev.yml down --remove-orphans
