param (
    [string]$BackupDir = "./backups",
    [string]$DbUrl = $env:DATABASE_URL,
    [string]$MediaDir = "./media-storage",
    [int]$RetentionDays = 14
)

$ErrorActionPreference = "Continue"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$TargetDir = Join-Path $BackupDir $Timestamp

Write-Host "Starting Simply E-Commerce Backup at $Timestamp..."

if (!(Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

$DbDumpFile = Join-Path $TargetDir "db_$Timestamp.dump"

if ($DbUrl) {
    Write-Host "Dumping PostgreSQL database..."
    $CleanDbUrl = $DbUrl -replace '\?.*$', ''
    $pgDumpPath = "pg_dump"
    if (Test-Path "D:\PostgreSQL\server18\bin\pg_dump.exe") {
        $pgDumpPath = "D:\PostgreSQL\server18\bin\pg_dump.exe"
    }

    try {
        & $pgDumpPath "$CleanDbUrl" -F c -f "$DbDumpFile"
        Write-Host "Database dump created: $DbDumpFile"
    } catch {
        Write-Host "pg_dump encountered: $_"
    }
}

$MediaArchive = ""
if (Test-Path $MediaDir) {
    $items = Get-ChildItem -Path $MediaDir
    if ($items.Count -gt 0) {
        $MediaArchive = Join-Path $TargetDir "media_$Timestamp.zip"
        Write-Host "Archiving media files..."
        Compress-Archive -Path "$MediaDir\*" -DestinationPath $MediaArchive -Force
        Write-Host "Media archive created: $MediaArchive"
    }
}

$ManifestFile = Join-Path $TargetDir "manifest.json"
$Manifest = @{
    timestamp = $Timestamp
    dbDump = $DbDumpFile
    mediaArchive = $MediaArchive
    retentionDays = $RetentionDays
} | ConvertTo-Json
Set-Content -Path $ManifestFile -Value $Manifest

Write-Host "Backup completed successfully in $TargetDir"
