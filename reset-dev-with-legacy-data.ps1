Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "=== Réinitialisation complète de la base dev avec données legacy ==="
Write-Host "Attention : suppression du volume PostgreSQL de développement."

docker compose -f docker-compose.dev.yml down -v --remove-orphans
docker compose -f docker-compose.dev.yml up --build -d

Write-Host "Attente du backend..."
for ($i = 1; $i -le 60; $i++) {
  try {
    Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get | Out-Null
    break
  } catch {
    Start-Sleep -Seconds 2
  }
}

powershell -ExecutionPolicy Bypass -File .\import-legacy-data.ps1
Write-Host "Application dev : http://localhost:5173"
Write-Host "Compte admin : admin@test.local / admin"
