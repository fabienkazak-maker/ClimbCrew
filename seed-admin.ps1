Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host "=== ClimbCrew - seed admin et données initiales ==="
docker compose -f docker-compose.dev.yml exec backend-dev node seed-local.js
