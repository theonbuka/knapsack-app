param(
    [ValidateSet('bundleRelease', 'assembleRelease')]
    [string]$Task = 'bundleRelease',

    [int]$VersionCode = 0
)

$ErrorActionPreference = 'Stop'

function Test-Java21Home {
    param(
        [Parameter(Mandatory = $true)]
        [string]$JavaHome
    )

    $javaExe = Join-Path $JavaHome 'bin\\java.exe'
    if (-not (Test-Path $javaExe)) {
        return $false
    }

    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'

    try {
        $versionOutput = & $javaExe -version 2>&1 | Out-String
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    return $LASTEXITCODE -eq 0 -and $versionOutput -match 'version "21\.'
}

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $workspaceRoot 'android'
$gradleWrapper = Join-Path $androidDir 'gradlew.bat'
$keystoreFile = Join-Path $androidDir 'keystore.properties'

if (-not (Test-Path $gradleWrapper)) {
    throw 'gradlew.bat not found under android/. Run this script from the project workspace.'
}

$candidateHomes = @()

if ($env:JAVA_HOME) {
    $candidateHomes += $env:JAVA_HOME
}

$searchRoots = @(
    'C:\Program Files\Eclipse Adoptium',
    'C:\Program Files\Java',
    'C:\Program Files\Microsoft',
    'C:\Program Files\Zulu'
)

foreach ($root in $searchRoots) {
    if (-not (Test-Path $root)) {
        continue
    }

    $candidateHomes += Get-ChildItem $root -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like 'jdk-21*' -or $_.Name -like 'zulu21*' } |
        Sort-Object Name -Descending |
        Select-Object -ExpandProperty FullName
}

$java21Home = $candidateHomes |
    Select-Object -Unique |
    Where-Object { Test-Java21Home -JavaHome $_ } |
    Select-Object -First 1

if (-not $java21Home) {
    throw 'JDK 21 not found. Install JDK 21 or set JAVA_HOME to a JDK 21 path before running Android release builds.'
}

$env:JAVA_HOME = $java21Home
$env:Path = "$java21Home\bin;$env:Path"

if ($VersionCode -gt 0) {
    $env:KNAPSACK_VERSION_CODE = $VersionCode.ToString()
}

if (-not (Test-Path $keystoreFile)) {
    Write-Warning 'keystore.properties not found. Release output may be unsigned and cannot be uploaded to Google Play production.'
}

Write-Host "Using JAVA_HOME=$java21Home"
Write-Host "Running Gradle task: $Task"

Push-Location $androidDir
try {
    & $gradleWrapper $Task
    if ($LASTEXITCODE -ne 0) {
        throw "Gradle task failed: $Task"
    }
} finally {
    Pop-Location
}