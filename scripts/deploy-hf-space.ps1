<#
.SYNOPSIS
  Helper script to sync and deploy CareerHub ML Proctoring service to Hugging Face Spaces.

.EXAMPLE
  .\scripts\deploy-hf-space.ps1 -SpaceRepoUrl "https://huggingface.co/spaces/your-username/careerhub-ml-proctoring"
#>

param(
    [Parameter(Mandatory=$false, HelpMessage="Hugging Face Space Git Repository URL")]
    [string]$SpaceRepoUrl
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  CareerHub ML Service -> Hugging Face Spaces Deployer  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not $SpaceRepoUrl) {
    Write-Host ""
    Write-Host "Step 1: If you haven't created a Space yet, go to: https://huggingface.co/new-space" -ForegroundColor Yellow
    Write-Host "  - SDK: Docker" -ForegroundColor Yellow
    Write-Host "  - Hardware: Blank / CPU basic (16GB RAM free)" -ForegroundColor Yellow
    Write-Host "  - Visibility: Public or Private" -ForegroundColor Yellow
    Write-Host ""
    $SpaceRepoUrl = Read-Host "Enter your Hugging Face Space Git Clone URL (e.g. https://huggingface.co/spaces/username/careerhub-ml)"
}

if (-not $SpaceRepoUrl.Trim()) {
    Write-Error "Space repository URL is required."
    exit 1
}

$RootDir = Split-Path -Parent $PSScriptRoot
$SourceDir = Join-Path $RootDir "services\proctoring"
$TempDir = Join-Path $env:TEMP "hf-space-deploy-$([System.Guid]::NewGuid().ToString().Substring(0,8))"

Write-Host "`n[1/4] Cloning Space repository into temporary folder..." -ForegroundColor Green
git clone $SpaceRepoUrl $TempDir

Write-Host "[2/4] Copying files from services/proctoring..." -ForegroundColor Green
$filesToCopy = @(
    "Dockerfile",
    "README.md",
    "requirements.txt",
    ".dockerignore",
    "server.py",
    "fusion_engine_new.py",
    "facial_inference.py",
    "voice_inference.py",
    "text_inference.py",
    "face_verifier.py"
)

foreach ($f in $filesToCopy) {
    $src = Join-Path $SourceDir $f
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $TempDir -Force
        Write-Host "  -> Copied $f" -ForegroundColor Gray
    }
}

Write-Host "[3/4] Committing files to git..." -ForegroundColor Green
Push-Location $TempDir
try {
    git add .
    $status = git status --porcelain
    if (-not $status) {
        Write-Host "No changes detected. Space is already up to date!" -ForegroundColor Yellow
    } else {
        git commit -m "Deploy CareerHub ML Proctoring service"
        Write-Host "[4/4] Pushing to Hugging Face Space..." -ForegroundColor Green
        git push
        Write-Host "`n Successfully deployed to Hugging Face Spaces!" -ForegroundColor Green
    }
} finally {
    Pop-Location
    Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "`nNEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Go to your Space on Hugging Face -> Settings -> Variables and secrets" -ForegroundColor White
Write-Host "2. Add Secret: INTERVIEW_ML_TOKEN (set to a strong password/secret)" -ForegroundColor White
Write-Host "3. In your Render / Backend .env, set:" -ForegroundColor White
Write-Host "   INTERVIEW_ML_URL=https://<your-space-name>.hf.space" -ForegroundColor Yellow
Write-Host "   INTERVIEW_ML_TOKEN=<the-secret-you-created>" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
