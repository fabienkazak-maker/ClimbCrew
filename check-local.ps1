Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host "=== Etat Docker Compose dev ==="
docker compose -f docker-compose.dev.yml ps
Write-Host ""
Write-Host "=== Test backend health via proxy direct ==="
try {
  Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get | ConvertTo-Json -Depth 10
} catch {
  Write-Host "Health backend indisponible : $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "=== Test login admin ==="
$body = @{ email = "admin@test.local"; password = "admin" } | ConvertTo-Json -Compress
try {
  Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 10
} catch {
  Write-Host "Login direct indisponible : $($_.Exception.Message)" -ForegroundColor Yellow
}
