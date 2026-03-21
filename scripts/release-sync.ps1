param(
    [switch]$DeployWeb,
    [switch]$SyncAndroid,
    [switch]$AssembleApk
)

$ErrorActionPreference = 'Stop'

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$parentRoot = Split-Path -Parent $workspaceRoot
$deployRoot = if (Test-Path (Join-Path $parentRoot '.vercel\project.json')) {
    $parentRoot
} else {
    $workspaceRoot
}

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Label,

        [Parameter(Mandatory = $true)]
        [scriptblock]$Action
    )

    Write-Host "==> $Label"
    & $Action

    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE"
    }
}

Push-Location $workspaceRoot
try {
    Invoke-Step 'Building web app' {
        npm run build
    }

    if ($SyncAndroid -or $AssembleApk) {
        Invoke-Step 'Syncing Android web assets' {
            npx cap sync android
        }
    }

    if ($AssembleApk) {
        Invoke-Step 'Assembling Android release APK' {
            powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/android-release.ps1 -Task assembleRelease
        }
    }

    if ($DeployWeb) {
        Push-Location $deployRoot
        try {
            Invoke-Step 'Deploying production web app to Vercel' {
                npx vercel deploy --prod --yes
            }
        } finally {
            Pop-Location
        }
    }
} finally {
    Pop-Location
}