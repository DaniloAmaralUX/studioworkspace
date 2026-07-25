<#
.SYNOPSIS
  Portao agregador fail-fast do automode (core do Project Studio).
.DESCRIPTION
  Ordem: typecheck backend -> typecheck frontend -> typecheck api ->
  [full] testes backend -> testes frontend -> build frontend.
  Exit 0 = verde. Qualquer etapa falha aborta imediatamente com exit 1.
  PS 5.1-safe: sem '&&', checa $LASTEXITCODE apos cada comando nativo.
.PARAMETER Quick
  Pula os testes (backend e frontend) e o build frontend (ciclo rapido ~30-40s).
  Sem -Quick roda o portao completo (~2-3min), obrigatorio 1x por fatia.
.PARAMETER BundleBudget
  Se informado (F4+), falha se algum chunk .js em frontend/dist/assets exceder o valor em kB.
#>
[CmdletBinding()]
param(
  [switch]$Quick,
  [int]$BundleBudget = 0
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

function Step {
  param([string]$Label, [string]$Dir, [string]$Exe, [string[]]$CmdArgs)
  Write-Host ""
  Write-Host "==> $Label" -ForegroundColor Cyan
  Push-Location $Dir
  try {
    & $Exe @CmdArgs
    $code = $LASTEXITCODE
  } finally {
    Pop-Location
  }
  if ($code -ne 0) {
    Write-Host "FALHOU: $Label (exit $code)" -ForegroundColor Red
    exit 1
  }
  Write-Host "ok: $Label" -ForegroundColor Green
}

$npm = 'npm.cmd'
$npx = 'npx.cmd'

Step -Label "typecheck backend" -Dir (Join-Path $root 'backend')  -Exe $npm -CmdArgs @('run','typecheck')
Step -Label "typecheck frontend" -Dir (Join-Path $root 'frontend') -Exe $npm -CmdArgs @('run','typecheck')
Step -Label "typecheck api" -Dir $root -Exe $npx -CmdArgs @('tsc','-p','api/tsconfig.json')

if (-not $Quick) {
  Step -Label "testes backend" -Dir (Join-Path $root 'backend') -Exe $npm -CmdArgs @('test')
  Step -Label "testes frontend" -Dir (Join-Path $root 'frontend') -Exe $npm -CmdArgs @('test')
  Step -Label "build frontend"  -Dir (Join-Path $root 'frontend') -Exe $npm -CmdArgs @('run','build')

  if ($BundleBudget -gt 0) {
    Write-Host ""
    Write-Host "==> orcamento de bundle ($BundleBudget kB)" -ForegroundColor Cyan
    $assets = Join-Path $root 'frontend\dist\assets'
    if (-not (Test-Path $assets)) {
      Write-Host "FALHOU: orcamento de bundle - dist/assets nao existe" -ForegroundColor Red
      exit 1
    }
    $offenders = Get-ChildItem -Path $assets -Filter '*.js' |
      Where-Object { ($_.Length / 1kB) -gt $BundleBudget }
    if ($offenders) {
      foreach ($f in $offenders) {
        $kb = [math]::Round($f.Length / 1kB)
        Write-Host ("FALHOU: {0} = {1} kB > {2} kB" -f $f.Name, $kb, $BundleBudget) -ForegroundColor Red
      }
      exit 1
    }
    Write-Host "ok: nenhum chunk .js acima de $BundleBudget kB" -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "VERDE: verify passou." -ForegroundColor Green
exit 0
