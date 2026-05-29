# Import yeux depuis le dossier assets Cursor → assets/eyes/
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$src = 'C:\Users\User\.cursor\projects\c-Users-User-Documents-Talk-Foot-TOM\assets'
$destDir = "$root\assets\eyes"

$map = @{
  'images_eyes_default_01-' = 'eyes_default_01.png'
  'images_eyes_round_02-'   = 'eyes_round_02.png'
  'images_eyes_sharp_03-'   = 'eyes_sharp_03.png'
  'images_eyes_sleepy_04-'  = 'eyes_sleepy_04.png'
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
