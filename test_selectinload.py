#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
测试应用启动并捕获错误
"""
import sys
import traceback

try:
    print("正在启动应用...")
    from app import app
    
    print("✅ 应用模块导入成功")
    print(f"✅ 应用名称: {app.name}")
    print(f"✅ 调试模式: {app.debug}")
    
    # 测试路由
    with app.app_context():
        from applications.view.system.ticket import bp as ticket_bp
        print(f"✅ 工单蓝图已注册")
        
        # 测试查询
        from applications.models import User
        from sqlalchemy.orm import selectinload
        
        print("\n正在测试查询...")
        try:
            # 测试selectinload
            user = User.query.options(
                selectinload(User.role).selectinload('power')
            ).first()
            
            if user:
                print(f"✅ 查询测试成功: {user.username}")
                if user.role:
                    print(f"✅ 角色加载成功: {user.role}")
                else:
                    print("⚠️ 用户没有角色")
            else:
                print("⚠️ 数据库中没有用户")
                
        except Exception as e:
            print(f"❌ 查询测试失败: {str(e)}")
            traceback.print_exc()
            sys.exit(1)
    
    print("\n✅ 所有测试通过！")
    sys.exit(0)
    
except Exception as e:
    print(f"❌ 错误: {str(e)}")
    traceback.print_exc()
    sys.exit(1)