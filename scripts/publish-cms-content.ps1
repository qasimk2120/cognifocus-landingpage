[CmdletBinding()]
param(
  [string]$BackendPath = "",
  [string]$Repo = "qasimk2120/cognifocus-landingpage",
  [string]$Branch = "main",
  [string]$CommitMessage = "Publish CMS fallback content",
  [switch]$SkipBuild,
  [switch]$SkipImport,
  [switch]$SkipPush,
  [switch]$SkipRemoteCheck,
  [switch]$CheckOnly,
  [switch]$DeployIfNoCommit,
  [switch]$WatchDeploy,
  [switch]$SyncBack
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-CommandChecked {
  param(
    [string]$Title,
    [scriptblock]$Command
  )

  Write-Step $Title
  & $Command

  if ($LASTEXITCODE -ne 0) {
    throw "$Title failed with exit code $LASTEXITCODE."
  }
}

function Test-GitDiffQuiet {
  param([string[]]$Paths)

  & git diff --quiet -- @Paths
  $exitCode = $LASTEXITCODE

  if ($exitCode -eq 0) {
    return $true
  }

  if ($exitCode -eq 1) {
    return $false
  }

  throw "git diff failed with exit code $exitCode."
}

function Test-GitCachedDiffQuiet {
  param([string[]]$Paths)

  & git diff --cached --quiet -- @Paths
  $exitCode = $LASTEXITCODE

  if ($exitCode -eq 0) {
    return $true
  }

  if ($exitCode -eq 1) {
    return $false
  }

  throw "git diff --cached failed with exit code $exitCode."
}

function Resolve-GhPath {
  $localGh = Join-Path $script:RepoRoot ".tools\bin\gh.exe"

  if (Test-Path $localGh) {
    return $localGh
  }

  $ghCommand = Get-Command gh -ErrorAction SilentlyContinue

  if ($ghCommand) {
    return $ghCommand.Source
  }

  throw "GitHub CLI was not found. Expected .tools\bin\gh.exe or gh on PATH."
}

$script:RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ContentPaths = @("src/content/blog", "src/content/releases")
Set-Location $script:RepoRoot

if (-not $BackendPath) {
  $BackendPath = Join-Path $script:RepoRoot "..\cognifocus-waiting-list-backend"
}

$BackendPath = Resolve-Path $BackendPath
$ImportScript = Join-Path $BackendPath "scripts\import-cms-content.js"

Write-Step "Checking repository state"
$currentBranch = (& git rev-parse --abbrev-ref HEAD).Trim()

if ($currentBranch -ne $Branch) {
  throw "You are on '$currentBranch'. Switch to '$Branch' before publishing CMS content."
}

$conflictedFiles = & git diff --name-only --diff-filter=U

if ($conflictedFiles) {
  throw "Resolve merge conflicts before publishing:`n$($conflictedFiles -join "`n")"
}

if (-not $SkipRemoteCheck) {
  Invoke-CommandChecked "Fetching origin/$Branch" {
    & git fetch origin $Branch
  }

  $behindCount = [int]((& git rev-list --count "HEAD..origin/$Branch").Trim())

  if ($behindCount -gt 0) {
    throw "Local $Branch is behind origin/$Branch by $behindCount commit(s). Pull first, then rerun this command."
  }
}

Invoke-CommandChecked "Checking for mojibake" {
  & npm.cmd run check:mojibake
}

if (-not $SkipBuild) {
  Invoke-CommandChecked "Building Astro site" {
    & npm.cmd run build
  }
}

if ($CheckOnly) {
  Write-Host ""
  Write-Host "CheckOnly is enabled. Validation finished without staging, importing, committing, pushing, or deploying." -ForegroundColor Green
  exit 0
}

if (-not $SkipImport) {
  if (-not (Test-Path $ImportScript)) {
    throw "CMS import script was not found at $ImportScript."
  }

  Push-Location $BackendPath
  try {
    Invoke-CommandChecked "Dry-running local JSON -> Firestore import" {
      & node scripts/import-cms-content.js --dry-run --overwrite
    }

    Invoke-CommandChecked "Writing local JSON -> Firestore" {
      & node scripts/import-cms-content.js --overwrite
    }
  } finally {
    Pop-Location
  }
}

Write-Step "Staging CMS fallback JSON"
& git add -- @ContentPaths

if ($LASTEXITCODE -ne 0) {
  throw "git add failed with exit code $LASTEXITCODE."
}

$hasStagedContentChanges = -not (Test-GitCachedDiffQuiet $ContentPaths)

if ($hasStagedContentChanges) {
  Invoke-CommandChecked "Committing CMS fallback JSON" {
    & git commit -m $CommitMessage
  }

  if ($SkipPush) {
    Write-Host "SkipPush is enabled. Commit created locally but not pushed."
  } else {
    Invoke-CommandChecked "Pushing to origin/$Branch" {
      & git push origin $Branch
    }

    Write-Host ""
    Write-Host "Pushed content commit. The deploy workflow runs automatically from the push." -ForegroundColor Green
  }
} else {
  Write-Host "No CMS fallback JSON changes to commit."

  if ($DeployIfNoCommit -and -not $SkipPush) {
    $gh = Resolve-GhPath
    Invoke-CommandChecked "Triggering deploy workflow" {
      & $gh workflow run "Deploy Astro Landing Page site to GitHub Pages" --repo $Repo --ref $Branch
    }
  }
}

if ($SyncBack -and -not $SkipPush) {
  $gh = Resolve-GhPath
  Invoke-CommandChecked "Triggering Firestore -> repo fallback sync" {
    & $gh workflow run "Sync CMS fallback content" --repo $Repo --ref $Branch -f prune=true
  }

  Write-Host "Sync workflow started. Pull after it finishes if it creates a follow-up commit."
}

if ($WatchDeploy -and -not $SkipPush) {
  $gh = Resolve-GhPath
  Invoke-CommandChecked "Showing latest deploy run" {
    & $gh run list --repo $Repo --workflow "Deploy Astro Landing Page site to GitHub Pages" --limit 1
  }
}

$unstagedContentChanges = -not (Test-GitDiffQuiet $ContentPaths)

if ($unstagedContentChanges) {
  Write-Host ""
  Write-Host "Note: CMS fallback JSON still has unstaged changes. Review git status before starting another sync." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "CMS content publish flow finished." -ForegroundColor Green
