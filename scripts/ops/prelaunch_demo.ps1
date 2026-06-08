param(
    [string]$MySqlBinDir = "C:\Program Files\MySQL\MySQL Server 8.0\bin",
    [string]$DbHost = "127.0.0.1",
    [int]$Port = 3306,
    [string]$User = "root",
    [string]$Password = "123456",
    [string]$Database = "pear_ticket",
    [string]$RestoreDatabase = "pear_ticket_restore",
    [string]$BaseUrl = "http://127.0.0.1:5000",
    [switch]$RunBackupRestore = $true
)

$ErrorActionPreference = "Stop"

function Step([string]$name) { Write-Host "`n=== $name ===" -ForegroundColor Cyan }
function Pass([string]$msg) { Write-Host "[PASS] $msg" -ForegroundColor Green }
function Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }
function Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }

$mysql = Join-Path $MySqlBinDir "mysql.exe"
if (!(Test-Path $mysql)) { throw "mysql.exe not found: $mysql" }
$env:MYSQL_PWD = $Password

Step "1) Check indexes"
$indexSql = @"
SHOW INDEX FROM $Database.ticket;
SHOW INDEX FROM $Database.ticket_flow;
"@
$mysqlArgs = @("-h$DbHost", "-P$Port", "-u$User", "-N", "-e", $indexSql)
$indexOut = & $mysql @mysqlArgs
if ($LASTEXITCODE -ne 0) {
    Fail "Query indexes failed: $indexOut"
    exit 1
}

$ticketIndexSql = @"
SELECT index_name, GROUP_CONCAT(column_name ORDER BY seq_in_index) AS cols
FROM information_schema.statistics
WHERE table_schema='$Database' AND table_name='ticket'
GROUP BY index_name;
"@
$flowIndexSql = @"
SELECT index_name, GROUP_CONCAT(column_name ORDER BY seq_in_index) AS cols
FROM information_schema.statistics
WHERE table_schema='$Database' AND table_name='ticket_flow'
GROUP BY index_name;
"@

$ticketIdxOut = & $mysql "-h$DbHost" "-P$Port" "-u$User" "-N" "-e" $ticketIndexSql
$flowIdxOut = & $mysql "-h$DbHost" "-P$Port" "-u$User" "-N" "-e" $flowIndexSql
if ($LASTEXITCODE -ne 0) {
    Fail "Query index columns failed"
    exit 1
}

function Has-IndexCols([string]$output, [string]$cols) {
    return ($output -split "`n" | Where-Object { $_ -match [regex]::Escape($cols) }).Count -gt 0
}

$missing = @()
if (-not (Has-IndexCols $ticketIdxOut "status,create_time")) { $missing += "ticket(status,create_time)" }
if (-not (Has-IndexCols $ticketIdxOut "assignee_name,create_time")) { $missing += "ticket(assignee_name,create_time)" }
if (-not (Has-IndexCols $ticketIdxOut "priority,create_time")) { $missing += "ticket(priority,create_time)" }
if (-not (Has-IndexCols $ticketIdxOut "source,create_time")) { $missing += "ticket(source,create_time)" }
if (-not (Has-IndexCols $flowIdxOut "ticket_id,create_time")) { $missing += "ticket_flow(ticket_id,create_time)" }
if (-not (Has-IndexCols $flowIdxOut "to_status,create_time")) { $missing += "ticket_flow(to_status,create_time)" }
if (-not (Has-IndexCols $flowIdxOut "handler,create_time")) { $missing += "ticket_flow(handler,create_time)" }

if ($missing.Count -eq 0) { Pass "Indexes OK" } else { Fail "Missing index groups: $($missing -join '; ')" }

Step "2) Check env vars in current shell"
$requiredEnvs = @("SECRET_KEY", "DATABASE_URL")
$missingEnv = @()
foreach ($k in $requiredEnvs) {
    if ([string]::IsNullOrWhiteSpace((Get-Item -Path "Env:$k" -ErrorAction SilentlyContinue).Value)) {
        $missingEnv += $k
    }
}
if ($missingEnv.Count -eq 0) { Pass "Env vars OK" } else { Warn "Missing env vars: $($missingEnv -join ', ')" }

Step "3) Check /health"
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get -TimeoutSec 5
    if ($health.status -eq "ok" -and $health.db -eq "ok") {
        Pass "/health OK"
    } else {
        Warn "/health unexpected: $($health | ConvertTo-Json -Compress)"
    }
} catch {
    Warn "/health failed: $($_.Exception.Message)"
}

Step "4) Check rate limit on /api/public/captcha"
$okCount = 0
$limitCount = 0
for ($i = 1; $i -le 35; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "$BaseUrl/api/public/captcha" -Method Get -TimeoutSec 5 -UseBasicParsing
        if ($resp.StatusCode -eq 200) { $okCount++ }
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 429) {
            $limitCount++
        }
    }
}
if ($limitCount -gt 0) { Pass "Rate limit effective (429=$limitCount, 200=$okCount)" } else { Warn "No 429 observed" }

if ($RunBackupRestore) {
    Step "5) Backup demo"
    $backupScript = Join-Path $PSScriptRoot "..\db\mysql_backup.ps1"
    & powershell -ExecutionPolicy Bypass -File $backupScript `
        -MySqlBinDir $MySqlBinDir -DbHost $DbHost -Port $Port -User $User -Password $Password -Database $Database
    if ($LASTEXITCODE -ne 0) { Fail "Backup failed"; exit 1 }
    Pass "Backup done"

    Step "6) Restore demo (test DB)"
    $latestBackup = Get-ChildItem -Path ".\backups" -Filter "$Database*.sql" |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $latestBackup) { Fail "Backup file not found"; exit 1 }

    $createDbSql = "CREATE DATABASE IF NOT EXISTS $RestoreDatabase DEFAULT CHARACTER SET utf8mb4;"
    $createDbArgs = @("-h$DbHost", "-P$Port", "-u$User", "-e", $createDbSql)
    & $mysql @createDbArgs
    if ($LASTEXITCODE -ne 0) { Fail "Create restore DB failed: $RestoreDatabase"; exit 1 }

    $restoreScript = Join-Path $PSScriptRoot "..\db\mysql_restore.ps1"
    & powershell -ExecutionPolicy Bypass -File $restoreScript `
        -MySqlBinDir $MySqlBinDir -DbHost $DbHost -Port $Port -User $User -Password $Password `
        -Database $RestoreDatabase -BackupFile $latestBackup.FullName
    if ($LASTEXITCODE -ne 0) { Fail "Restore failed"; exit 1 }

    $countSql = @"
SELECT COUNT(*) AS src_count FROM $Database.ticket;
SELECT COUNT(*) AS dst_count FROM $RestoreDatabase.ticket;
"@
    $countArgs = @("-h$DbHost", "-P$Port", "-u$User", "-N", "-e", $countSql)
    $countOut = & $mysql @countArgs
    if ($LASTEXITCODE -ne 0) { Fail "Row count compare failed"; exit 1 }
    Pass "Restore done, row count compare:"
    Write-Host $countOut
}

Write-Host "`nDemo finished."
