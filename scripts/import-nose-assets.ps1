# Import nez depuis le dossier assets Cursor → assets/nose/
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$src = 'C:\Users\User\.cursor\projects\c-Users-User-Documents-Talk-Foot-TOM\assets'
$destDir = "$root\assets\nose"

$map = @{
  'images_nose_big-'          = 'nose_big.png'
  'images_nose_round-'        = 'nose_round.png'
  'images_nose_thin-'         = 'nose_thin.png'
  'images_nose_small_light-'  = 'nose_small_light.png'
}

New-Item -ItemType Directory -Force -Path $destDir | Out-Null
Get-ChildItem $destDir -Filter '*.png' -File | Remove-Item -Force

$copied = 0
foreach ($entry in $map.GetEnumerator()) {
  $prefix = $entry.Key
  $outName = $entry.Value
  $matches = Get-ChildItem $src -Filter '*.png' -File | Where-Object { $_.Name -like "c__*_${prefix}*" }
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
