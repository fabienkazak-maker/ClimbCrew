Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$certPath = Join-Path $PSScriptRoot "certs\localhost.crt"
$keyPath = Join-Path $PSScriptRoot "certs\localhost.key"

$mustCreateCert = $false
if (!(Test-Path $certPath) -or !(Test-Path $keyPath)) {
  $mustCreateCert = $true
} elseif ((Get-Item $certPath).PSIsContainer -or (Get-Item $keyPath).PSIsContainer) {
  $mustCreateCert = $true
} else {
  $certFirstLine = Get-Content $certPath -First 1
  $keyFirstLine = Get-Content $keyPath -First 1
  if ($certFirstLine -notmatch "BEGIN CERTIFICATE" -or $keyFirstLine -notmatch "BEGIN .*PRIVATE KEY") {
    $mustCreateCert = $true
  }
}

if ($mustCreateCert) {
  Write-Host "Certificat HTTPS local absent ou invalide. Régénération..."
  powershell -ExecutionPolicy Bypass -File .\create-local-certificate.ps1
}

powershell -ExecutionPolicy Bypass -File .\build-server-local.ps1
