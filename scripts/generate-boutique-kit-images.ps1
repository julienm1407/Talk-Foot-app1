# Génère les visuels boutique (fond blanc, produit centré) pour toutes les nations.

param(
  [string[]]$KeepManualIso = @(),
  [int]$Size = 1000,
  [double]$Padding = 0.04
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$jerseyDir = Join-Path $root 'public\jerseys\nations'
$shortDir = Join-Path $root 'public\shorts\nations'
$packDir = Join-Path $root 'public\kits\nations'

foreach ($d in @($jerseyDir, $shortDir, $packDir)) {
  New-Item -ItemType Directory -Force -Path $d | Out-Null
}

function Draw-FittedInBox {
  param(
    [System.Drawing.Graphics]$G,
    [System.Drawing.Image]$Img,
    [float]$BoxX,
    [float]$BoxY,
    [float]$BoxW,
    [float]$BoxH
  )
  $scale = [Math]::Min($BoxW / $Img.Width, $BoxH / $Img.Height)
  $w = [float]($Img.Width * $scale)
  $h = [float]($Img.Height * $scale)
  $x = $BoxX + ($BoxW - $w) / 2
  $y = $BoxY + ($BoxH - $h) / 2
  $G.DrawImage($Img, $x, $y, $w, $h)
}

function Export-BoutiqueTile {
  param(
    [string]$SrcPath,
    [string]$DestPath,
    [int]$CanvasSize = 1000,
    [double]$PadRatio = 0.04
  )

  $src = $null
  $out = $null
  $g = $null
  try {
    $src = [System.Drawing.Image]::FromFile($SrcPath)
    $out = New-Object System.Drawing.Bitmap $CanvasSize, $CanvasSize
    $g = [System.Drawing.Graphics]::FromImage($out)
    $g.Clear([System.Drawing.Color]::White)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $pad = [float]($CanvasSize * $PadRatio)
    Draw-FittedInBox $g $src $pad $pad ($CanvasSize - 2 * $pad) ($CanvasSize - 2 * $pad)
    $out.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    if ($g) { $g.Dispose() }
    if ($out) { $out.Dispose() }
    if ($src) { $src.Dispose() }
    [GC]::Collect()
  }
}

function Export-PackTile {
  param(
    [string]$JerseyPath,
    [string]$ShortPath,
    [string]$DestPath,
    [int]$CanvasSize = 1000
  )

  $j = $null
  $s = $null
  $out = $null
  $g = $null
  try {
    $j = [System.Drawing.Image]::FromFile($JerseyPath)
    $s = [System.Drawing.Image]::FromFile($ShortPath)
    $out = New-Object System.Drawing.Bitmap $CanvasSize, $CanvasSize
    $g = [System.Drawing.Graphics]::FromImage($out)
    $g.Clear([System.Drawing.Color]::White)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $pad = [float]($CanvasSize * 0.04)
    $innerW = $CanvasSize - 2 * $pad
    $jerseyH = $CanvasSize * 0.55
    $shortH = $CanvasSize * 0.34
    $gap = $CanvasSize * 0.02
    Draw-FittedInBox $g $j $pad $pad $innerW $jerseyH
    Draw-FittedInBox $g $s $pad ($pad + $jerseyH + $gap) $innerW $shortH
    $out.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    if ($g) { $g.Dispose() }
    if ($out) { $out.Dispose() }
    if ($j) { $j.Dispose() }
    if ($s) { $s.Dispose() }
    [GC]::Collect()
  }
}

$keep = @{}
foreach ($iso in $KeepManualIso) { $keep[$iso.ToLowerInvariant()] = $true }

$jerseys = Get-ChildItem $jerseyDir -Filter '*.png' -File |
  Where-Object { $_.BaseName -notmatch '-boutique$' }

$countJersey = 0
$countShort = 0
$countPack = 0

foreach ($file in $jerseys) {
  $slug = $file.BaseName.ToLowerInvariant()
  if ($slug -match '-') { continue }

  $jerseySrc = $file.FullName
  $shortSrc = Join-Path $shortDir "$slug.png"
  $jerseyDest = Join-Path $jerseyDir "$slug-boutique.png"
  $shortDest = Join-Path $shortDir "$slug-boutique.png"
  $packDest = Join-Path $packDir "$slug-pack.png"
  $manual = $keep.ContainsKey($slug)

  if (-not $manual -or -not (Test-Path $jerseyDest)) {
    Export-BoutiqueTile -SrcPath $jerseySrc -DestPath $jerseyDest -CanvasSize $Size -PadRatio $Padding
    $countJersey++
    Write-Host "Maillot $slug"
  }

  if (Test-Path $shortSrc) {
    if (-not $manual -or -not (Test-Path $shortDest)) {
      Export-BoutiqueTile -SrcPath $shortSrc -DestPath $shortDest -CanvasSize $Size -PadRatio $Padding
      $countShort++
      Write-Host "Short $slug"
    }
    $jForPack = if (Test-Path $jerseyDest) { $jerseyDest } else { $jerseySrc }
    $sForPack = if (Test-Path $shortDest) { $shortDest } else { $shortSrc }
    if (-not $manual -or -not (Test-Path $packDest)) {
      Export-PackTile -JerseyPath $jForPack -ShortPath $sForPack -DestPath $packDest -CanvasSize $Size
      $countPack++
      Write-Host "Pack $slug"
    }
  }
}

Write-Host "Termine: $countJersey maillots, $countShort shorts, $countPack packs."
