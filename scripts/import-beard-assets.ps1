# Import barbes depuis le dossier assets Cursor → assets/beard/
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$src = 'C:\Users\User\.cursor\projects\c-Users-User-Documents-Talk-Foot-TOM\assets'
$destDir = "$root\assets\beard"

# Ordre : motifs les plus longs en premier (évite beard_full__2_ → beard_full)
$map = [ordered]@{
  'images_moustache__1_-'   = 'beard_mustache.png'
  'images_beard_full__1_-' = 'beard_full.png'
  'images_beard_full__2_-' = 'beard_mustache.png'
  'images_beard_3days-'    = 'beard_3days.png'
  'images_beard_goatee-'   = 'beard_goatee.png'
  'images_beard_short-'    = 'beard_short.png'
  'images_beard_full-'     = 'beard_full.png'
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
