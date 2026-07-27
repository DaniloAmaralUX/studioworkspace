<#
.SYNOPSIS
  Abre o Claude Code usando o Amazon Bedrock como provedor, com o modelo fixado em Sonnet.

.DESCRIPTION
  Lê a credencial de `backend/.env` (fonte única do segredo no disco) e exporta as variáveis
  apenas para ESTE processo — nada é gravado em settings.json nem no ambiente da máquina.

  Fixa os modelos de propósito: sem pin, o padrão do Claude Code no Bedrock é Opus, bem mais
  caro por token. Para trocar pontualmente, defina ANTHROPIC_MODEL antes de chamar o script.

.EXAMPLE
  ./scripts/claude-bedrock.ps1
  ./scripts/claude-bedrock.ps1 -p "resuma o README"
#>
[CmdletBinding()]
param(
  # Argumentos repassados ao `claude` (PS 5.1: $Args é reservado, ver docs/solutions).
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]] $Passthrough
)

$ErrorActionPreference = 'Stop'

$repo = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $repo 'backend\.env'

if (-not (Test-Path $envFile)) {
  Write-Error "Nao encontrei $envFile. Copie backend/.env.example para backend/.env e preencha."
  exit 1
}

Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq '' -or $line.StartsWith('#')) { return }
  $i = $line.IndexOf('=')
  if ($i -lt 1) { return }
  $name = $line.Substring(0, $i).Trim()
  $value = $line.Substring($i + 1).Trim()
  if ($value -ne '') { Set-Item -Path "env:$name" -Value $value }
}

$hasIam = $env:AWS_ACCESS_KEY_ID -and $env:AWS_SECRET_ACCESS_KEY
if (-not $env:AWS_BEARER_TOKEN_BEDROCK -and -not $hasIam) {
  Write-Error 'Sem credencial AWS em backend/.env (AWS_BEARER_TOKEN_BEDROCK ou par IAM).'
  exit 1
}

$env:CLAUDE_CODE_USE_BEDROCK = '1'
if (-not $env:AWS_REGION) { $env:AWS_REGION = 'us-east-2' }
if (-not $env:ANTHROPIC_MODEL) { $env:ANTHROPIC_MODEL = 'us.anthropic.claude-sonnet-4-6' }
if (-not $env:ANTHROPIC_DEFAULT_HAIKU_MODEL) {
  $env:ANTHROPIC_DEFAULT_HAIKU_MODEL = 'us.anthropic.claude-haiku-4-5-20251001-v1:0'
}

Write-Host "Claude Code -> Amazon Bedrock | regiao: $($env:AWS_REGION) | modelo: $($env:ANTHROPIC_MODEL)"

Push-Location $repo
try {
  if ($Passthrough) { & claude @Passthrough } else { & claude }
} finally {
  Pop-Location
}
