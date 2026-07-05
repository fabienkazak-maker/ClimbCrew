Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$body = @{ email = "admin@test.local"; password = "admin" } | ConvertTo-Json -Compress
Write-Host "=== Test login API legacy ==="
Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -ContentType "application/json" -Body $body
