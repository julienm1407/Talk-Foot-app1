# Télécharge les drapeaux CDM vers public/flags/ (ISO3 minuscules, ex. fra.png).
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$outDir = Join-Path $root 'public\flags'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$map = @{
  FRA = 'fr'; ESP = 'es'; DEU = 'de'; ENG = 'gb-eng'; PRT = 'pt'; BEL = 'be'; NLD = 'nl'
  HRV = 'hr'; CHE = 'ch'; AUT = 'at'; NOR = 'no'; TUR = 'tr'; SWE = 'se'; BIH = 'ba'; CZE = 'cz'; SCO = 'gb-sct'
  ARG = 'ar'; BRA = 'br'; URY = 'uy'; COL = 'co'; ECU = 'ec'; PRY = 'py'
  USA = 'us'; MEX = 'mx'; CAN = 'ca'; HTI = 'ht'; PAN = 'pa'; CUW = 'cw'
  MAR = 'ma'; DZA = 'dz'; SEN = 'sn'; TUN = 'tn'; EGY = 'eg'; GHA = 'gh'; CIV = 'ci'; CPV = 'cv'; ZAF = 'za'; COG = 'cg'
  JPN = 'jp'; KOR = 'kr'; AUS = 'au'; SAU = 'sa'; QAT = 'qa'; IRQ = 'iq'; IRN = 'ir'; JOR = 'jo'; UZB = 'uz'
  NZL = 'nz'
}

$ok = 0
$fail = 0
foreach ($iso in $map.Keys) {
  $code = $map[$iso]
  $url = "https://flagcdn.com/w160/$code.png"
  $dest = Join-Path $outDir "$($iso.ToLower()).png"
  try {
    Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
    Write-Host "OK $iso -> $dest"
    $ok++
  } catch {
    Write-Warning "FAIL $iso ($url): $_"
    $fail++
  }
}
Write-Host "Done: $ok ok, $fail failed -> $outDir"
