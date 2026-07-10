$ErrorActionPreference = "Stop"

Write-Host "== AI QA Interview Coach local setup =="

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created .env from .env.example"
}

npm.cmd install

$dockerAvailable = $null -ne (Get-Command docker -ErrorAction SilentlyContinue)
if ($dockerAvailable) {
  docker compose up -d postgres
} else {
  Write-Host "Docker was not found. Start PostgreSQL manually with the credentials from README.md."
}

npm.cmd run prisma:generate
npm.cmd run prisma:migrate
npm.cmd run lint
npm.cmd run test

Write-Host "Setup finished. Run npm.cmd run dev to start API and Web."
