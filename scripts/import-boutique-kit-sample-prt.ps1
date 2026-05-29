# Exemple : importer les visuels boutique Portugal (maillot, short, pack) depuis assets Cursor.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$src = 'C:\Users\User\.cursor\projects\c-Users-User-Documents-Talk-Foot-TOM\assets'

$jerseySrc = Get-ChildItem $src -Filter '*Design_sans_titre__6_*' -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$shortSrc = Get-ChildItem $src -Filter '*Design_sans_titre__8_*' -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$packSrc = Get-ChildItem $src -Filter '*Design_sans_titre__7_*' -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1

$jerseyDir = "$root\public\jerseys\nations"
$shortDir = "$root\public\shorts\nations"
$packDir = "$root\public\kits\nations"

foreach ($d in @($jerseyDir, $shortDir, $packDir)) {
  New-Item -ItemType Directory -Force -Path $d | Out-Null
}

if ($jerseySrc) {
  Copy-Item $jerseySrc.FullName (Join-Path $jerseyDir 'prt-boutique.png') -Force
  Write-Host "OK maillot -> prt-boutique.png"
}
if ($shortSrc) {
  Copy-Item $shortSrc.FullName (Join-Path $shortDir 'prt-boutique.png') -Force
  Write-Host "OK short -> prt-boutique.png"
}
if ($packSrc) {
  Copy-Item $packSrc.FullName (Join-Path $packDir 'prt-pack.png') -Force
  Write-Host "OK pack -> prt-pack.png"
}

Write-Host 'Bump KIT_ASSET_VERSION dans src/data/nations.ts si le navigateur garde l ancien cache.'
