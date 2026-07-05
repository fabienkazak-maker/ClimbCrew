Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "=== Verification Docker ==="
docker ps

Write-Host ""
Write-Host "=== Test nginx HTTPS / frontend ==="
$html = curl.exe -k -s -o NUL -w "%{http_code}" https://localhost:8443/
Write-Host "GET / => HTTP $html"
if ($html -ne "200") { throw "Frontend HTTPS indisponible" }

Write-Host ""
Write-Host "=== Test API non connectee ==="
$api = curl.exe -k -s -i https://localhost:8443/api/auth/me
Write-Host $api
if ($api -notmatch "401" -and $api -notmatch "Authentification") {
  throw "La route API /api/auth/me ne repond pas comme attendu."
}

Write-Host ""
Write-Host "=== Test login admin ==="
$body = @{ email = "admin@test.local"; password = "admin" } | ConvertTo-Json -Compress
try {
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $login = Invoke-RestMethod -Uri "https://localhost:8443/api/auth/login" -Method Post -ContentType "application/json" -Body $body -WebSession $session -SkipCertificateCheck
} catch {
  # Windows PowerShell 5.1 ne supporte pas -SkipCertificateCheck : fallback curl.
  $loginRaw = curl.exe -k -s -X POST "https://localhost:8443/api/auth/login" -H "Content-Type: application/json" --data-raw '{"email":"admin@test.local","password":"admin"}'
  Write-Host $loginRaw
  if ($loginRaw -notmatch '"ok"\s*:\s*true') { throw "Login admin KO" }
  Write-Host "Login admin OK via curl."
  exit 0
}

if (!$login.ok) { throw "Login admin KO" }
Write-Host "Login admin OK."
