Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "=== Verification ClimbCrew HTTPS local ==="

Write-Host "=== Verification des conteneurs ==="
docker ps

Write-Host "=== Test page HTTPS ==="
$homeBody = Join-Path $env:TEMP "climbcrew_home.html"
$homeStatus = curl.exe -k -s -o $homeBody -w "%{http_code}" "https://localhost:8443/"

if ($homeStatus -ne "200") {
  throw "La page HTTPS ne repond pas correctement. Code HTTP : $homeStatus"
}

Write-Host "Page HTTPS OK : HTTP $homeStatus"

Write-Host "=== Test API non connectee ==="
$apiBody = Join-Path $env:TEMP "climbcrew_auth_me.json"
$apiStatus = curl.exe -k -s -o $apiBody -w "%{http_code}" "https://localhost:8443/api/auth/me"
$apiContent = Get-Content $apiBody -Raw

Write-Host "Code HTTP API : $apiStatus"
Write-Host "Reponse API   : $apiContent"

if ($apiStatus -ne "401") {
  throw "La route API /api/auth/me devrait repondre 401 sans authentification. Code obtenu : $apiStatus"
}

if ($apiContent -notmatch "Authentification requise") {
  throw "La route API /api/auth/me ne retourne pas le message attendu."
}

Write-Host "API OK : acces refuse correctement sans connexion."
Write-Host "=== Verification terminee avec succes ==="
Write-Host "Application disponible : https://localhost:8443"