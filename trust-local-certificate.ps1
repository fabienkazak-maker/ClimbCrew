Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$certPath = Join-Path $PSScriptRoot "certs\localhost.crt"

if (!(Test-Path $certPath)) {
  throw "Certificat introuvable. Lance d'abord .\create-local-certificate.ps1"
}

if ((Get-Item $certPath).PSIsContainer) {
  throw "Certificat invalide : localhost.crt est un dossier. Relance .\create-local-certificate.ps1"
}

$firstLine = Get-Content $certPath -First 1
if ($firstLine -notmatch "BEGIN CERTIFICATE") {
  throw "Certificat invalide : localhost.crt n'est pas au format PEM. Relance .\create-local-certificate.ps1"
}

Write-Host "=== Ajout du certificat local dans CurrentUser\Root ==="
Write-Host "Cette action permet à Edge/Chrome de faire confiance à https://localhost:8443."

Import-Certificate -FilePath $certPath -CertStoreLocation Cert:\CurrentUser\Root | Out-Null

Write-Host "Certificat local ajouté. Ferme puis rouvre le navigateur si l'avertissement persiste."
