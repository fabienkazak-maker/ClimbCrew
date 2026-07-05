Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$repoUrl = "https://github.com/fabienkazak-maker/ClimbCrew.git"

Write-Host "=== Publication complète du code vers GitHub ==="
Write-Host "Dépôt : $repoUrl"
Write-Host "Attention : cette opération remplace la branche main distante."

if (!(Test-Path ".git")) {
  git init
}

if (git remote | Select-String -SimpleMatch "origin") {
  git remote set-url origin $repoUrl
} else {
  git remote add origin $repoUrl
}

git branch -M main

git add -A

$hasChanges = git status --porcelain
if ($hasChanges) {
  git commit -m "Version ClimbCrew HTTPS Docker vérifiée"
} else {
  Write-Host "Aucun changement local à committer."
}

Write-Host "Push avec --force-with-lease vers origin/main..."
git push --force-with-lease -u origin main

Write-Host "Publication terminée."
