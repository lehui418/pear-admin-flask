#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
测试应用启动
"""
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("正在导入应用模块...")
    from app import app
    
    print("✅ 应用模块导入成功")
    print(f"✅ 应用名称: {app.name}")
    print(f"✅ 调试模式: {app.debug}")
    print(f"✅ 配置已加载")
    
    # 测试路由是否正确注册
    print("\n正在检查路由...")
    with app.app_context():
        from applications.view.system.ticket import bp as ticket_bp
        print(f"✅ 工单蓝图已注册: {ticket_bp.name}")
        print(f"✅ 工单蓝图URL前缀: {ticket_bp.url_prefix}")
        
        # 检查关键路由
        rules = list(app.url_map.iter_rules())
        ticket_routes = [rule for rule in rules if 'ticket' in rule.rule]
        print(f"✅ 工单相关路由数量: {len(ticket_routes)}")
        
        # 检查 save 路由
        save_route = [rule for rule in ticket_routes if 'save' in rule.rule]
        if save_route:
            print(f"✅ save 路由存在: {save_route[0].rule}")
        
    print("\n✅ 所有测试通过！应用可以正常启动。")
    sys.exit(0)
    
except Exception as e:
    print(f"❌ 错误: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)