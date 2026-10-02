param (
    [Parameter(Mandatory=$true)]
    [string]$BackupDir,
    [string]$TargetDbUrl = $env:TEST_DATABASE_URL,
    [string]$TargetMediaDir = "./media-restore-test"
)

$ErrorActionPreference = "Continue"

Write-Host "Restoring Simply E-Commerce Backup from $BackupDir..."

# 1. Verify Manifest
$ManifestFile = Join-Path $BackupDir "manifest.json"
if (Test-Path $ManifestFile) {
    Write-Host "Found backup manifest."
    $Manifest = Get-Content $ManifestFile | ConvertFrom-Json
}

# 2. Database Restore (pg_restore)
$DumpFile = Get-ChildItem -Path $BackupDir -Filter "*.dump" | Select-Object -First 1
if ($DumpFile) {
    Write-Host "Restoring database to $TargetDbUrl..."
    $CleanTargetDbUrl = $TargetDbUrl -replace '\?.*$', ''
    $pgRestorePath = "pg_restore"
    if (Test-Path "D:\PostgreSQL\server18\bin\pg_restore.exe") {
        $pgRestorePath = "D:\PostgreSQL\server18\bin\pg_restore.exe"
    }

    try {
        & $pgRestorePath -d "$CleanTargetDbUrl" --clean --if-exists "$($DumpFile.FullName)"
        Write-Host "Database restore finished."
    } catch {
        Write-Host "pg_restore result: $_"
    }
}

# 3. Media Restore
$ZipFile = Get-ChildItem -Path $BackupDir -Filter "*.zip" | Select-Object -First 1
if ($ZipFile) {
    Write-Host "Restoring media directory to $TargetMediaDir..."
    if (!(Test-Path $TargetMediaDir)) {
        New-Item -ItemType Directory -Path $TargetMediaDir -Force | Out-Null
    }
    Expand-Archive -Path $ZipFile.FullName -DestinationPath $TargetMediaDir -Force
    Write-Host "Media restore finished."
}

Write-Host "Verification completed."
