# 生产优化落地（4/5/6）

本文覆盖以下三项：
- 4) 索引与慢 SQL 排查
- 5) 统一异常与日志追踪
- 6) 备份与恢复预案

## 4. 索引与慢 SQL

### 4.1 执行索引脚本
```powershell
mysql -uroot -p123456 pear_ticket < scripts/db/mysql_add_indexes.sql
```

已新增索引：
- `ticket(status, create_time)`
- `ticket(assignee_name, create_time)`
- `ticket(priority, create_time)`
- `ticket(source, create_time)`
- `ticket_flow(ticket_id, create_time)`
- `ticket_flow(to_status, create_time)`
- `ticket_flow(handler, create_time)`

### 4.2 开启 MySQL 慢查询日志（MySQL 8）
在 `my.ini` 增加或确认：
```ini
slow_query_log=1
slow_query_log_file="C:/ProgramData/MySQL/MySQL Server 8.0/Data/slow.log"
long_query_time=1
log_queries_not_using_indexes=1
```

重启 MySQL 服务后生效。

### 4.3 慢查询分析建议
- 每天分析一次 `slow.log`。
- 优先优化 TOP N（按 Query_time 排序）且调用频次高的 SQL。
- 先看 `EXPLAIN` 是否命中索引，再决定是否补联合索引或改 SQL 条件顺序。

## 5. 统一异常与日志追踪

已完成：
- 为每个请求生成/透传 `X-Request-ID`。
- 响应头回传 `X-Request-ID`，便于前后端与日志对齐。
- 统一错误处理：`/api/*` 返回 JSON，页面路由返回错误页模板。
- 日志格式增加 `req:{request_id}` 字段。

涉及文件：
- `applications/__init__.py`
- `applications/extensions/init_error_views.py`

## 6. 备份与恢复预案

### 6.1 手动备份
```powershell
powershell -ExecutionPolicy Bypass -File scripts/db/mysql_backup.ps1 `
  -User root -Password 123456 -Database pear_ticket
```

### 6.2 手动恢复
```powershell
powershell -ExecutionPolicy Bypass -File scripts/db/mysql_restore.ps1 `
  -User root -Password 123456 -Database pear_ticket `
  -BackupFile .\backups\pear_ticket_YYYYMMDD_HHMMSS.sql
```

### 6.3 Windows 计划任务（建议）
- 每天凌晨执行 `mysql_backup.ps1`。
- `KeepDays` 默认 14 天，可按磁盘容量调整。
- 每月至少做 1 次恢复演练（在测试库恢复并抽样校验工单数据）。

## 验收标准
- 索引已创建并可在 `SHOW INDEX FROM ticket;` 中看到。
- 慢查询日志已开启并产生文件。
- API 异常返回 JSON 且包含对应请求日志（通过 `request_id` 可关联）。
- 每日备份文件可生成，恢复脚本可在测试库成功执行。

## 新增上线项（连接池 + 健康检查 + 限流）

已完成：
- 连接池参数：`SQLALCHEMY_ENGINE_OPTIONS`（`pool_pre_ping/pool_recycle/pool_timeout/pool_size/max_overflow`）。
- 健康检查：`GET /health`，会执行 `SELECT 1` 验证数据库可达性。
- 公开接口限流：`/api/public/captcha`、`/api/public/ticket/submit`、`/api/public/ticket/query`（按 IP 的滑动窗口）。

建议环境变量（生产）：
```env
DB_POOL_RECYCLE=1800
DB_POOL_TIMEOUT=30
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
```

一键演示脚本：
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ops\prelaunch_demo.ps1 `
  -User root -Password 123456 -Database pear_ticket -BaseUrl http://127.0.0.1:5000
```

发布SOP清单：
- `docs/ops/release-sop-checklist.md`
