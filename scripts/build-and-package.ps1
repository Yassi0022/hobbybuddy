#!/usr/bin/env pwsh
# build-and-package.ps1 — Full build: frontend build + copy + Spring Boot package.
#
# Usage: .\scripts\build-and-package.ps1 [-SkipTests]
#
# From the repo root, this script:
#   1. Builds the frontend (npm run build in frontend_v2/)
#   2. Copies dist/ to Spring Boot static resources
#   3. Runs Maven package

param(
    [switch]$SkipTests = $true
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

Write-Host "=== HobbyBuddy Full Build ===" -ForegroundColor Cyan
Write-Host ""

# ── 1. Frontend build ──────────────────────────────────────
Write-Host "[1/3] Building frontend..." -ForegroundColor Yellow
Push-Location (Join-Path $repoRoot "frontend_v2")
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed (exit code $LASTEXITCODE)" }
}
finally {
    Pop-Location
}
Write-Host "  Frontend build OK." -ForegroundColor Green
Write-Host ""

# ── 2. Copy to Spring Boot static ──────────────────────────
Write-Host "[2/3] Copying to Spring Boot static resources..." -ForegroundColor Yellow
& (Join-Path $repoRoot "scripts\copy-frontend.ps1")
Write-Host ""

# ── 3. Maven package ───────────────────────────────────────
Write-Host "[3/3] Maven package..." -ForegroundColor Yellow
Push-Location (Join-Path $repoRoot "hobbybuddy-platform")
try {
    $mvnArgs = @("package")
    if ($SkipTests) { $mvnArgs += "-DskipTests" }
    & ./mvnw @mvnArgs
    if ($LASTEXITCODE -ne 0) { throw "Maven build failed (exit code $LASTEXITCODE)" }
}
finally {
    Pop-Location
}
Write-Host ""
Write-Host "=== Build complete ===" -ForegroundColor Cyan
Write-Host "JAR: hobbybuddy-platform\target\demo-0.0.1-SNAPSHOT.jar"
Write-Host "Run: java -jar hobbybuddy-platform\target\demo-0.0.1-SNAPSHOT.jar"
