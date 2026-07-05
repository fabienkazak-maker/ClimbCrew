Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "=== Création d'un certificat HTTPS local PEM pour localhost ==="

$rootDir = $PSScriptRoot
$certsDir = Join-Path $rootDir "certs"
$nginxCertsDir = Join-Path $rootDir "nginx\certs"
$tmpDir = Join-Path $rootDir ".tmp\cert-build"

# Nettoyage volontaire : les versions précédentes ont pu créer localhost.key comme dossier.
Remove-Item -Recurse -Force $certsDir -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $nginxCertsDir -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $tmpDir -ErrorAction SilentlyContinue

New-Item -ItemType Directory -Force -Path $certsDir | Out-Null
New-Item -ItemType Directory -Force -Path $nginxCertsDir | Out-Null
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

$configPath = Join-Path $certsDir "localhost-openssl.cnf"
$certPath = Join-Path $certsDir "localhost.crt"
$keyPath = Join-Path $certsDir "localhost.key"

@'
[req]
default_bits       = 2048
prompt             = no
default_md         = sha256
distinguished_name = dn
x509_extensions    = v3_req

[dn]
C  = FR
O  = ClimbCrew Local
CN = localhost

[v3_req]
subjectAltName = @alt_names
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
basicConstraints = critical, CA:false

[alt_names]
DNS.1 = localhost
DNS.2 = climbcrew.local
IP.1  = 127.0.0.1
IP.2  = ::1
'@ | Set-Content -Encoding ASCII $configPath

$gitOpenSsl = "C:\Program Files\Git\usr\bin\openssl.exe"
$opensslCmd = $null

if (Test-Path $gitOpenSsl) {
  $opensslCmd = $gitOpenSsl
} else {
  $cmd = Get-Command openssl.exe -ErrorAction SilentlyContinue
  if ($cmd) { $opensslCmd = $cmd.Source }
}

if ($opensslCmd) {
  Write-Host "OpenSSL Windows trouvé : $opensslCmd"

  & $opensslCmd req `
    -x509 `
    -nodes `
    -newkey rsa:2048 `
    -days 825 `
    -keyout $keyPath `
    -out $certPath `
    -config $configPath `
    -extensions v3_req
} else {
  Write-Host "OpenSSL Windows introuvable. Génération via Docker..."

  docker run --rm `
    -v "${certsDir}:/certs" `
    alpine:3.20 `
    sh -lc "apk add --no-cache openssl >/dev/null && openssl req -x509 -nodes -newkey rsa:2048 -days 825 -keyout /certs/localhost.key -out /certs/localhost.crt -config /certs/localhost-openssl.cnf -extensions v3_req"

  if ($LASTEXITCODE -ne 0) {
    throw "Échec de génération du certificat via Docker. Vérifie que Docker Desktop est lancé."
  }
}

if (!(Test-Path $certPath)) { throw "Certificat non créé : $certPath" }
if (!(Test-Path $keyPath)) { throw "Clé privée non créée : $keyPath" }

if ((Get-Item $certPath).PSIsContainer) { throw "Certificat invalide : localhost.crt est un dossier." }
if ((Get-Item $keyPath).PSIsContainer) { throw "Clé invalide : localhost.key est un dossier." }

$certFirstLine = Get-Content $certPath -First 1
$keyFirstLine = Get-Content $keyPath -First 1

if ($certFirstLine -notmatch "BEGIN CERTIFICATE") {
  throw "Certificat invalide : localhost.crt n'est pas au format PEM. Première ligne : $certFirstLine"
}

if ($keyFirstLine -notmatch "BEGIN .*PRIVATE KEY") {
  throw "Clé invalide : localhost.key n'est pas au format PEM. Première ligne : $keyFirstLine"
}

Copy-Item $certPath (Join-Path $nginxCertsDir "localhost.crt") -Force
Copy-Item $keyPath (Join-Path $nginxCertsDir "localhost.key") -Force

Write-Host "Certificat PEM créé : $certPath"
Write-Host "Clé privée PEM créée : $keyPath"
Write-Host "Copie nginx créée dans : $nginxCertsDir"
Write-Host "OK : certificat local valide."
