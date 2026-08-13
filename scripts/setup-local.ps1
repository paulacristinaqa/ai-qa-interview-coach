$ErrorActionPreference = "Stop"

function Invoke-Checked {
  param(
    [Parameter(Mandatory = $true)][string]$Description,
    [Parameter(Mandatory = $true)][scriptblock]$Command
  )
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "$Description failed with exit code $LASTEXITCODE."
  }
}

Write-Host "== AI QA Interview Coach local setup =="

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created .env from .env.example"
}

Invoke-Checked "Dependency installation" { npm.cmd install }
Invoke-Checked "Prisma Client generation" { npm.cmd run prisma:generate }

$dockerAvailable = $null -ne (Get-Command docker -ErrorAction SilentlyContinue)
if ($dockerAvailable) {
  docker info *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "Docker was found, but its daemon is not running. Start Docker Desktop and retry."
  }
  Invoke-Checked "PostgreSQL container startup. Review 'docker compose logs postgres'" { docker compose up -d postgres }
} else {
  Write-Host "Docker was not found. Checking for a manually managed PostgreSQL instance..."
}

Invoke-Checked "PostgreSQL readiness check" { npm.cmd run db:wait }
Invoke-Checked "Prisma migration deployment" { npm.cmd run prisma:migrate:deploy }
Invoke-Checked "Prisma migration status check" { npm.cmd run prisma:migrate:status }
Invoke-Checked "Database seed" { npm.cmd run seed }
Invoke-Checked "Lint" { npm.cmd run lint }
Invoke-Checked "Typecheck" { npm.cmd run typecheck }
Invoke-Checked "Tests" { npm.cmd run test }
Invoke-Checked "Production build" { npm.cmd run build }

Write-Host "Setup finished. Run npm.cmd run dev to start API and Web."
