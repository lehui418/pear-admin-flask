#!/usr/bin/env python
"""
手动执行数据库迁移，添加超时字段
"""
import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 设置环境变量
os.environ.setdefault('FLASK_APP', 'app.py')
os.environ.setdefault('FLASK_ENV', 'development')

from applications import create_app
from applications.extensions import db
from sqlalchemy import text

def manual_migration():
    """手动执行数据库迁移"""
    app = create_app()
    with app.app_context():
        try:
            print("开始手动执行数据库迁移...")
            
            # 检查字段是否已存在
            result = db.session.execute(text("PRAGMA table_info(ticket_flow)"))
            columns = [row[1] for row in result.fetchall()]
            
            print(f"当前ticket_flow表的字段: {columns}")
            
            # 添加is_overdue字段
            if 'is_overdue' not in columns:
                print("添加is_overdue字段...")
                db.session.execute(text("ALTER TABLE ticket_flow ADD COLUMN is_overdue BOOLEAN DEFAULT 0"))
                print("is_overdue字段添加成功")
            else:
                print("is_overdue字段已存在")
            
            # 添加overdue_hours字段
            if 'overdue_hours' not in columns:
                print("添加overdue_hours字段...")
                db.session.execute(text("ALTER TABLE ticket_flow ADD COLUMN overdue_hours FLOAT DEFAULT 0.0"))
                print("overdue_hours字段添加成功")
            else:
                print("overdue_hours字段已存在")
            
            # 添加sla_threshold字段
            if 'sla_threshold' not in columns:
                print("添加sla_threshold字段...")
                db.session.execute(text("ALTER TABLE ticket_flow ADD COLUMN sla_threshold INTEGER DEFAULT 24"))
                print("sla_threshold字段添加成功")
            else:
                print("sla_threshold字段已存在")
            
            # 提交更改
            db.session.commit()
            print("数据库迁移完成！")
            
            # 再次检查字段
            result = db.session.execute(text("PRAGMA table_info(ticket_flow)"))
            columns = [row[1] for row in result.fetchall()]
            print(f"迁移后ticket_flow表的字段: {columns}")
            
        except Exception as e:
            print(f"数据库迁移失败: {e}")
            db.session.rollback()

if __name__ == "__main__":
    manual_migration()