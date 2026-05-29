# Import cheveux depuis le dossier assets Cursor → assets/hair/ (noms propres).
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$src = 'C:\Users\User\.cursor\projects\c-Users-User-Documents-Talk-Foot-TOM\assets'
$destDir = "$root\assets\hair"

$map = @{
  'images_hair_fade-'       = 'hair_fade.png'
  'images_hair_long-'       = 'hair_long.png'
  'images_hair_buzzcut-'    = 'hair_buzzcut.png'
  'images_Curly_Hair-'      = 'hair_curly.png'
  'images_hair_long_straight-' = 'hair_long_straight.png'
  'images_hair_long_wavy-'  = 'hair_long_wavy.png'
  'images_hair_middlepart-' = 'hair_middlepart.png'
  'images_hair_spiky-'      = 'hair_spiky.png'
  'images_hair_afro-'       = 'hair_afro.png'
  'images_hair_braids-'     = 'hair_braids.png'
  'images_hair_ponytail-'   = 'hair_ponytail.png'
}

New-Item -ItemType Directory -Force -Path $destDir | Out-Null
Get-ChildItem $destDir -Filter '*.png' -File | Remove-Item -Force

$copied = 0
foreach ($entry in $map.GetEnumerator()) {
  $prefix = $entry.Key
  $outName = $entry.Value
  $matches = Get-ChildItem $src -Filter "*.png" -File | Where-Object { $_.Name -like "c__*_${prefix}*" }
  if (-not $matches) {
    Write-Warning "Manquant: $prefix"
    continue
  }
  $file = $matches | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  Copy-Item $file.FullName (Join-Path $destDir $outName) -Force
  $copied++
  Write-Host "OK $($file.Name) -> $outName"
}

Write-Host "Imported: $copied / $($map.Count)"
Write-Host "Fichiers dans assets/hair: $((Get-ChildItem $destDir -Filter '*.png').Count)"
