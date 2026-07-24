<#
  start-workspace.ps1 — sobe o Project Studio (backend + frontend) localmente.
  Uso:  ./start-workspace.ps1
  Não instala nada em silêncio além de `npm install` nas pastas do projeto.
#>

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$backend  = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'
$BACKEND_URL  = 'http://127.0.0.1:5178'
$FRONTEND_URL = 'http://127.0.0.1:5177'

function Test-Cmd($name) { $null -ne (Get-Command $name -ErrorAction SilentlyContinue) }

Write-Host '== Project Studio - verificando pre-requisitos ==' -ForegroundColor Cyan

foreach ($c in 'node','npm') {
  if (-not (Test-Cmd $c)) { Write-Error "Faltando: $c. Instale o Node.js e tente de novo."; exit 1 }
}
Write-Host ("node {0} / npm {1}" -f (node -v), (npm -v)) -ForegroundColor Green

# gh é opcional para subir, mas necessário para a fonte GitHub
if (Test-Cmd 'gh') {
  try { gh auth status 1>$null 2>$null; Write-Host 'gh: autenticado' -ForegroundColor Green }
  catch { Write-Host 'gh presente, mas NAO autenticado. Rode: gh auth login' -ForegroundColor Yellow }
} else {
  Write-Host 'gh ausente - a fonte GitHub fica indisponivel ate instalar o GitHub CLI.' -ForegroundColor Yellow
}

if (-not (Test-Path $backend) -or -not (Test-Path $frontend)) {
  Write-Host ''
  Write-Host 'As pastas backend/ e/ou frontend/ ainda nao existem.' -ForegroundColor Yellow
  Write-Host 'Abra esta pasta no Claude Code e peca para comecar a Fatia 0 (veja ROADMAP.md).' -ForegroundColor Yellow
  exit 0
}

function Ensure-Deps($dir) {
  if (-not (Test-Path (Join-Path $dir 'node_modules'))) {
    Write-Host "Instalando dependencias em $dir ..." -ForegroundColor Cyan
    Push-Location $dir; npm install; Pop-Location
  }
}
Ensure-Deps $backend
Ensure-Deps $frontend

function Test-Url($url) {
  try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 $url 1>$null 2>$null; $true }
  catch { $false }
}

# Idempotente: só sobe o que ainda não está no ar (rodar 2x não duplica janela).
Write-Host '== Subindo servicos ==' -ForegroundColor Cyan
if (Test-Url "$BACKEND_URL/api/health") {
  Write-Host 'Backend ja esta no ar - mantendo.' -ForegroundColor Green
} else {
  Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', "cd /d `"$backend`" && npm run dev"
}
if (Test-Url $FRONTEND_URL) {
  Write-Host 'Frontend ja esta no ar - mantendo.' -ForegroundColor Green
} else {
  Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', "cd /d `"$frontend`" && npm run dev"
}

# Esperar o frontend responder (até ~30s) e abrir o navegador
Write-Host "Aguardando $FRONTEND_URL ..." -ForegroundColor Cyan
$ok = $false
for ($i = 0; $i -lt 30; $i++) {
  try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 $FRONTEND_URL 1>$null 2>$null; $ok = $true; break }
  catch { Start-Sleep -Seconds 1 }
}
if ($ok) { Start-Process $FRONTEND_URL; Write-Host 'Project Studio no ar.' -ForegroundColor Green }
else { Write-Host "Frontend ainda nao respondeu. Verifique a janela do frontend e abra $FRONTEND_URL manualmente." -ForegroundColor Yellow }

Write-Host "Backend:  $BACKEND_URL" -ForegroundColor DarkGray
Write-Host "Frontend: $FRONTEND_URL" -ForegroundColor DarkGray
