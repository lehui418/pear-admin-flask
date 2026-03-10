#!/usr/bin/env python
"""
执行数据库迁移脚本
"""
from applications import create_app
from flask_migrate import upgrade

def run_migration():
    """执行数据库迁移"""
    app = create_app()
    with app.app_context():
        try:
            print("开始执行数据库迁移...")
            upgrade()
            print("数据库迁移完成！")
        except Exception as e:
            print(f"数据库迁移失败: {e}")

if __name__ == "__main__":
    run_migration()