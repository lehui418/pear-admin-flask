param(
    [string]$MySqlBinDir = "C:\Program Files\MySQL\MySQL Server 8.0\bin",
    [string]$DbHost = "127.0.0.1",
    [int]$Port = 3306,
    [string]$User = "root",
    [string]$Password = "123456",
    [string]$Database = "pear_ticket",
    [string]$BackupDir = ".\backups",
    [int]$KeepDays = 14
)

$ErrorActionPreference = "Stop"
$env:MYSQL_PWD = $Password

if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $BackupDir "$Database`_$ts.sql"
$mysqldump = Join-Path $MySqlBinDir "mysqldump.exe"

if (!(Test-Path $mysqldump)) {
    throw "mysqldump not found: $mysqldump"
}

& $mysqldump "-h$DbHost" "-P$Port" "-u$User" --set-gtid-purged=OFF --single-transaction --routines --events --triggers $Database | Out-File -Encoding utf8 $backupFile

Get-ChildItem -Path $BackupDir -Filter "$Database*.sql" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KeepDays) } |
    Remove-Item -Force

Write-Host "Backup completed: $backupFile"
