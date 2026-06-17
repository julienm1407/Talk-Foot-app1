# Importe des visuels « Design sans titre » (maillot / pack / short) depuis assets Cursor.
# Convention Portugal (exemple) :
#   Design_sans_titre__6_  → maillot  → {iso}-boutique.png (jerseys)
#   Design_sans_titre__8_  → short    → {iso}-boutique.png (shorts)
#   Design_sans_titre__7_  → pack     → {iso}-pack.png
#
# Pour chaque pays, nomme tes exports dans assets avec le pays + suffixe, ex. :
#   images_Portugal_...__6_...  images_France_...__6_...
# Ce script associe via la même table que import-jersey-shorts-assets.ps1.

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$src = 'C:\Users\User\.cursor\projects\c-Users-User-Documents-Talk-Foot-TOM\assets'

$nationMap = @{
  'Afrique_du_Sud' = 'zaf'; 'alg_rie' = 'dza'; 'Algerie' = 'dza'; 'Angleterre' = 'eng'
  'Arabie_Saoudte' = 'sau'; 'allemagne' = 'deu'; 'argentine' = 'arg'; 'arabie_saoudite' = 'sau'
  'australie' = 'aus'; 'autriche' = 'aut'; 'belgique' = 'bel'; 'bresil' = 'bra'; 'Br_sil' = 'bra'
  'bosnie' = 'bih'; 'canada' = 'can'; 'capvert' = 'cpv'; 'colombie' = 'col'
  'congo_brazzaville' = 'cog'; 'republique_du_congo' = 'cog'
  'rd_congo' = 'cod'; 'rdc' = 'cod'; 'republique_democratique_du_congo' = 'cod'
  'cote_d_ivoire' = 'civ'; 'croatie' = 'hrv'; 'curacao' = 'cuw'; 'Cura_ao' = 'cuw'
  'ecosse' = 'sco'; 'egypte' = 'egy'; 'england' = 'eng'; 'equateur' = 'ecu'; 'espagne' = 'esp'
  'etat_unis' = 'usa'; 'Etats_Unis' = 'usa'; 'france' = 'fra'; 'ghana' = 'gha'; 'haiti' = 'hti'
  'Iran' = 'irn'; 'iraq' = 'irq'; 'japon' = 'jpn'; 'Jordanie' = 'jor'; 'korea' = 'kor'
  'Cor_e_du_Sud' = 'kor'; 'Maroc' = 'mar'; 'Mexique' = 'mex'; 'Norv_ge' = 'nor'; 'Norvege' = 'nor'
  'Nouvelle_Z_lande' = 'nzl'; 'Nouvelle_Zelande' = 'nzl'; 'Ouzb_kistan' = 'uzb'; 'Ouzbekistan' = 'uzb'
  'Panama' = 'pan'; 'Paraguay' = 'pry'; 'Pays_Bas' = 'nld'; 'Portugal' = 'prt'; 'Qatar' = 'qat'
  'Rep._Tcheque' = 'cze'; 'Rep_Tcheque' = 'cze'; 'Senegal' = 'sen'; 'S_n_gal' = 'sen'
  'Suede' = 'swe'; 'Suisse' = 'che'; 'Tunisie' = 'tun'; 'Turquie' = 'tur'; 'Uruguay' = 'ury'
}

$jerseyDir = "$root\public\jerseys\nations"
$shortDir = "$root\public\shorts\nations"
$packDir = "$root\public\kits\nations"
foreach ($d in @($jerseyDir, $shortDir, $packDir)) {
  New-Item -ItemType Directory -Force -Path $d | Out-Null
}

function Resolve-Nation([string]$name) {
  foreach ($entry in $nationMap.GetEnumerator()) {
    if ($name -match $entry.Key) { return $entry.Value }
  }
  return $null
}

function Pick-Latest($files) {
  if (-not $files) { return $null }
  return $files | Sort-Object LastWriteTime -Descending | Select-Object -First 1
}

$designFiles = Get-ChildItem $src -Filter '*.png' -File | Where-Object { $_.Name -match 'Design_sans_titre__' }
if (-not $designFiles) {
  Write-Host 'Aucun fichier Design_sans_titre dans assets.'
  exit 0
}

$byNation = @{}
foreach ($f in $designFiles) {
  $slug = Resolve-Nation $f.Name
  if (-not $slug) { continue }
  if (-not $byNation.ContainsKey($slug)) { $byNation[$slug] = @{ jersey = @(); short = @(); pack = @() } }
  if ($f.Name -match '__6_') { $byNation[$slug].jersey += $f }
  elseif ($f.Name -match '__8_') { $byNation[$slug].short += $f }
  elseif ($f.Name -match '__7_') { $byNation[$slug].pack += $f }
}

$imported = 0
foreach ($entry in $byNation.GetEnumerator()) {
  $slug = $entry.Key
  $j = Pick-Latest $entry.Value.jersey
  $s = Pick-Latest $entry.Value.short
  $p = Pick-Latest $entry.Value.pack
  if ($j) {
    Copy-Item $j.FullName (Join-Path $jerseyDir "$slug-boutique.png") -Force
    $imported++
    Write-Host "OK maillot $slug"
  }
  if ($s) {
    Copy-Item $s.FullName (Join-Path $shortDir "$slug-boutique.png") -Force
    $imported++
    Write-Host "OK short $slug"
  }
  if ($p) {
    Copy-Item $p.FullName (Join-Path $packDir "$slug-pack.png") -Force
    $imported++
    Write-Host "OK pack $slug"
  }
}

Write-Host "Import Design boutique: $imported fichiers."
