# Day 07 - CI最小回归接入（P2-2）

## 今日目标
- 把 `P0` 最小回归脚本接入 CI，做到每次代码变更自动验收。

## 本次改动
- 新增 GitHub Actions 工作流：`.github/workflows/p0-min-regression.yml`

## CI执行流程
1. 安装依赖（`pip install -r requirements.txt`）。
2. 使用 `sqlite` 初始化 CI 数据库（`ci.db`）。
3. 执行 `flask --app app:app admin init` 注入基础数据。
4. 重置回归账号密码为固定值（`admin/admin123`、`test/test123`）。
5. 启动应用并等待就绪。
6. 运行回归脚本：
   - `python scripts/regression/run_p0_min_regression.py --base-url http://127.0.0.1:5000 --username admin --password admin123`
7. 上传产物：
   - `logs/p0-min-regression-result.json`
   - `logs/ci-app.log`
   - `logs/pear-admin.log`

## 触发方式
- 手动触发：`workflow_dispatch`
- 代码触发：`pull_request`、`push`（`main/master`）

## 验收标准
- CI中 `P0` 最小回归步骤通过。
- 失败时可在 artifacts 下载日志与结果文件定位问题。

## 备注
- CI为开发模式（`APP_ENV=development`）以支持自动验证码调试接口。
- 生产环境仍应保持 `debug=false`。
