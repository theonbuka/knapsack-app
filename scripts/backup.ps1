param(
  [string]$ExternalDest
)

# Create backups directory
$root = Get-Location
$backupsDir = Join-Path $root 'backups'
if (-not (Test-Path $backupsDir)) { New-Item -ItemType Directory -Path $backupsDir | Out-Null }

# Timestamp for filename
$ts = (Get-Date).ToString('yyyyMMdd-HHmmss')
$zipName = "knapsack-app-backup-$ts.zip"
$zipPath = Join-Path $backupsDir $zipName

# Exclude the backups folder and existing zip files to avoid recursion
#$items = Get-ChildItem -Path $root -Force | Where-Object { $_.Name -ne 'backups' -and $_.Extension -ne '.zip' }

# Use Compress-Archive on all files but exclude backups folder and any .zip
$include = Get-ChildItem -Path $root -Force | Where-Object { $_.Name -ne 'backups' }
$paths = $include | ForEach-Object { $_.FullName }

Compress-Archive -Path $paths -DestinationPath $zipPath -Force -CompressionLevel Optimal

Write-Host "Created backup:" $zipPath

# If ExternalDest parameter provided, copy the zip there
if (-not [string]::IsNullOrWhiteSpace($ExternalDest)) {
  try {
    if (-not (Test-Path $ExternalDest)) { New-Item -ItemType Directory -Path $ExternalDest -Force | Out-Null }
    Copy-Item -Path $zipPath -Destination $ExternalDest -Force
    Write-Host "Copied backup to:" (Resolve-Path $ExternalDest)
  } catch {
    Write-Host "Failed to copy to external destination:" $_.Exception.Message
  }
} elseif ($env:BACKUP_DEST) {
  try {
    $ext = $env:BACKUP_DEST
    if (-not (Test-Path $ext)) { New-Item -ItemType Directory -Path $ext -Force | Out-Null }
    Copy-Item -Path $zipPath -Destination $ext -Force
    Write-Host "Copied backup to (from BACKUP_DEST):" (Resolve-Path $ext)
  } catch {
    Write-Host "Failed to copy to BACKUP_DEST:" $_.Exception.Message
  }
}
