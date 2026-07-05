Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "=== Import données legacy ClimbCrew ==="
Write-Host "Le backend doit être lancé sur http://localhost:3001"

$headers = @{ "X-Setup-Token" = "local-setup" }
$uri = "http://localhost:3001/import-data?confirm=oui"
$result = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers
$result | ConvertTo-Json -Depth 10

Write-Host "=== Vérification couleurs/passeports ==="
docker compose -f docker-compose.dev.yml exec db-dev psql -U app -d app_dev -c "select passport, count(*) from participants group by passport order by passport;"
docker compose -f docker-compose.dev.yml exec db-dev psql -U app -d app_dev -c "select couleur_prises, count(*) from routes group by couleur_prises order by couleur_prises;"
docker compose -f docker-compose.dev.yml exec db-dev psql -U app -d app_dev -c "select couleur_corde, count(*) from ropes group by couleur_corde order by couleur_corde;"
