param(
    [string]$MySqlBinDir = "C:\Program Files\MySQL\MySQL Server 8.0\bin",
    [string]$DbHost = "127.0.0.1",
    [int]$Port = 3306,
    [string]$User = "root",
    [string]$Password = "123456",
    [string]$Database = "pear_ticket",
    [Parameter(Mandatory = $true)][string]$BackupFile
)

$ErrorActionPreference = "Stop"
$env:MYSQL_PWD = $Password

$mysql = Join-Path $MySqlBinDir "mysql.exe"
if (!(Test-Path $mysql)) {
    throw "mysql.exe not found: $mysql"
}
if (!(Test-Path $BackupFile)) {
    throw "backup file not found: $BackupFile"
}

$sqlPath = (Resolve-Path $BackupFile).Path -replace "\\","/"
$restoreSql = "SOURCE $sqlPath;"
& $mysql "-h$DbHost" "-P$Port" "-u$User" $Database -e $restoreSql
if ($LASTEXITCODE -ne 0) {
    throw "restore failed: $BackupFile -> $Database"
}
Write-Host "Restore completed: $BackupFile -> $Database"
