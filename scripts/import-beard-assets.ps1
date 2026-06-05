# Import barbes depuis le dossier assets Cursor → assets/beard/ (via process-beard-assets.mjs)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$src = 'C:\Users\User\.cursor\projects\c-Users-User-Documents-Talk-Foot-TOM\assets'

if (-not (Test-Path $src)) {
  throw "Dossier source introuvable: $src"
}

Write-Host "Traitement moustache + barbe complète (fond transparent, canvas 1024)..."
Push-Location $root
try {
  node (Join-Path $PSScriptRoot 'process-beard-assets.mjs') $src
} finally {
  Pop-Location
}

Write-Host "Terminé. Vérifiez dans le studio avatar (slot barbe)."
