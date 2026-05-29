# Import chaussures depuis le dossier assets Cursor → assets/shoes/
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$src = 'C:\Users\User\.cursor\projects\c-Users-User-Documents-Talk-Foot-TOM\assets'
$destDir = "$root\assets\shoes"

$map = @{
  'images_Shoes_Base-'    = 'shoes_base.png'
  'images_Shoes_Bleu-'    = 'shoes_bleu.png'
  'images_Shoes_Rouge-'   = 'shoes_rouge.png'
  'images_Shoes_Jaunee-' = 'shoes_jaune.png'
  'images_Shoes_Vertes-'  = 'shoes_vert.png'
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
