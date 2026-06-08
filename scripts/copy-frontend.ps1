#!/usr/bin/env pwsh
# copy-frontend.ps1 — Copies the built frontend dist/ into Spring Boot static resources.
# Run this after `npm run build` in frontend_v2/ to update the backend's static files.
#
# Usage: .\scripts\copy-frontend.ps1
#   Assumes it's run from the repo root (C:\hobbybuddy).

$ErrorActionPreference = "Stop"

$repoRoot      = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$distDir       = Join-Path $repoRoot "frontend_v2\dist"
$staticDir     = Join-Path $repoRoot "hobbybuddy-platform\src\main\resources\static"
$assetsSrcDir  = Join-Path $distDir "assets"
$assetsDestDir = Join-Path $staticDir "assets"

# Validate dist exists
if (-not (Test-Path $distDir)) {
    Write-Error "Frontend dist/ not found at $distDir. Run 'npm run build' in frontend_v2/ first."
    exit 1
}

# Ensure static assets directory exists
if (-not (Test-Path $assetsDestDir)) {
    New-Item -ItemType Directory -Path $assetsDestDir -Force | Out-Null
}

# Copy index.html
Write-Host "Copying index.html..."
Copy-Item (Join-Path $distDir "index.html") (Join-Path $staticDir "index.html") -Force

# Copy JS and CSS assets (skip source maps if present)
Write-Host "Copying assets..."
Get-ChildItem $assetsSrcDir -File | Where-Object { $_.Extension -match '\.(js|css)$' } | ForEach-Object {
    Copy-Item $_.FullName (Join-Path $assetsDestDir $_.Name) -Force
    Write-Host "  $($_.Name)"
}

# Copy root-level PWA files (service-worker.js, version.json, manifest.json, favicon)
Write-Host "Copying PWA files..."
@('service-worker.js', 'version.json', 'manifest.json', 'favicon.svg') | ForEach-Object {
    $src = Join-Path $distDir $_
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $staticDir $_) -Force
        Write-Host "  $_"
    }
}

Write-Host "`nDone. Frontend dist copied to Spring Boot static resources."
Write-Host "Next: cd hobbybuddy-platform; .\mvnw package -DskipTests"
