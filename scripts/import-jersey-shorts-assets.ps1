# Import maillots & shorts — garde uniquement la version la plus récente par pays / base.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$src = 'C:\Users\User\.cursor\projects\c-Users-User-Documents-Talk-Foot-TOM\assets'

$nationMap = @{
  'Afrique_du_Sud' = 'zaf'
  'alg_rie' = 'dza'
  'Algerie' = 'dza'
  'Angleterre' = 'eng'
  'Arabie_Saoudte' = 'sau'
  'allemagne' = 'deu'
  'argentine' = 'arg'
  'arabie_saoudite' = 'sau'
  'australie' = 'aus'
  'autriche' = 'aut'
  'belgique' = 'bel'
  'bresil' = 'bra'
  'Br_sil' = 'bra'
  'bosnie' = 'bih'
  'canada' = 'can'
  'cap_vert' = 'cpv'
  'colombie' = 'col'
  'congo_brazzaville' = 'cog'
  'republique_du_congo' = 'cog'
  'rd_congo' = 'cod'
  'rdc' = 'cod'
  'republique_democratique_du_congo' = 'cod'
  'cote_d_ivoire' = 'civ'
  'croatie' = 'hrv'
  'curacao' = 'cuw'
  'Cura_ao' = 'cuw'
  'ecosse' = 'sco'
  'egypte' = 'egy'
  'england' = 'eng'
  'equateur' = 'ecu'
  'espagne' = 'esp'
  'etat_unis' = 'usa'
  'Etats_Unis' = 'usa'
  'france' = 'fra'
  'ghana' = 'gha'
  'haiti' = 'hti'
  'Iran' = 'irn'
  'iraq' = 'irq'
  'japon' = 'jpn'
  'Jordanie' = 'jor'
  'korea' = 'kor'
  'Cor_e_du_Sud' = 'kor'
  'Maroc' = 'mar'
  'Mexique' = 'mex'
  'Norv_ge' = 'nor'
  'Norvege' = 'nor'
  'Nouvelle_Z_lande' = 'nzl'
  'Nouvelle_Zelande' = 'nzl'
  'Ouzb_kistan' = 'uzb'
  'Ouzbekistan' = 'uzb'
  'Panama' = 'pan'
  'Paraguay' = 'pry'
  'Pays_Bas' = 'nld'
  'Portugal' = 'prt'
  'Qatar' = 'qat'
  'Rep._Tcheque' = 'cze'
  'Rep_Tcheque' = 'cze'
  'Senegal' = 'sen'
  'S_n_gal' = 'sen'
  'Suede' = 'swe'
  'Suisse' = 'che'
  'Tunisie' = 'tun'
  'Turquie' = 'tur'
  'Uruguay' = 'ury'
}

$baseMap = @{
  'Base_Blanc' = 'blanc'
  'Base_Bleu' = 'bleu'
  'Base_Jaune' = 'jaune'
  'Base_Rouge' = 'rouge'
}

$targetDirs = @(
  "$root\public\jerseys\nations",
  "$root\public\jerseys\base",
  "$root\public\shorts\nations",
  "$root\public\shorts\base",
  "$root\assets\jerseys",
  "$root\assets\shorts"
)

function Resolve-Key([string]$name) {
  foreach ($entry in $nationMap.GetEnumerator()) {
    if ($name -match $entry.Key) { return @{ kind = 'nation'; slug = $entry.Value } }
  }
  foreach ($entry in $baseMap.GetEnumerator()) {
    if ($name -match $entry.Key) { return @{ kind = 'base'; slug = $entry.Value } }
  }
  return $null
}

# Purge anciens fichiers
foreach ($d in $targetDirs) {
  if (Test-Path $d) {
    Get-ChildItem $d -Filter '*.png' -File -ErrorAction SilentlyContinue | Remove-Item -Force
  } else {
    New-Item -ItemType Directory -Force -Path $d | Out-Null
  }
}

# Regroupe par clé et garde le fichier le plus récent
$best = @{}

Get-ChildItem $src -Filter '*.png' -File | ForEach-Object {
  $name = $_.Name
  if ($name -notmatch 'images_') { return }

  $isShort = $name -match 'images_Short_'
  if (-not $isShort -and $name -match 'Short_') { return }

  $resolved = Resolve-Key $name
  if (-not $resolved) { return }

  $bucket = if ($isShort) { 'short' } else { 'jersey' }
  $id = "$bucket|$($resolved.kind)|$($resolved.slug)"
  $existing = $best[$id]
  if (-not $existing -or $_.LastWriteTime -gt $existing.LastWriteTime) {
    $best[$id] = $_
  }
}

$jerseyCount = 0
$shortCount = 0

foreach ($entry in $best.GetEnumerator()) {
  $parts = $entry.Key -split '\|'
  $bucket = $parts[0]
  $kind = $parts[1]
  $slug = $parts[2]
  $file = $entry.Value

  if ($bucket -eq 'jersey') {
    if ($kind -eq 'base') {
      $destPublic = "$root\public\jerseys\base\$slug.png"
      $destAssets = "$root\assets\jerseys\jersey_base_$slug.png"
    } else {
      $destPublic = "$root\public\jerseys\nations\$slug.png"
      $destAssets = "$root\assets\jerseys\jersey_$slug.png"
    }
    Copy-Item $file.FullName $destPublic -Force
    Copy-Item $file.FullName $destAssets -Force
    $jerseyCount++
  } else {
    if ($kind -eq 'base') {
      $destPublic = "$root\public\shorts\base\$slug.png"
      $destAssets = "$root\assets\shorts\short_base_$slug.png"
    } else {
      $destPublic = "$root\public\shorts\nations\$slug.png"
      $destAssets = "$root\assets\shorts\short_$slug.png"
    }
    Copy-Item $file.FullName $destPublic -Force
    Copy-Item $file.FullName $destAssets -Force
    $shortCount++
  }
}

Write-Host "Imported jerseys (latest only): $jerseyCount"
Write-Host "Imported shorts (latest only): $shortCount"
$big = Get-ChildItem "$root\public\jerseys\nations\*.png" | Where-Object { $_.Length -gt 150000 }
if ($big.Count -gt 0) {
  Write-Warning "Still large jerseys (>150KB): $($big.Name -join ', ')"
} else {
  Write-Host "All nation jerseys are compact (<=150KB)."
}
