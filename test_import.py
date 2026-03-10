#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
简单测试应用导入
"""
import sys

try:
    print("开始测试...")
    print("1. 导入Flask...")
    from flask import Flask
    print("✅ Flask导入成功")
    
    print("2. 导入应用配置...")
    from applications.config import Config
    print("✅ 配置导入成功")
    
    print("3. 导入数据库...")
    from applications.extensions import db
    print("✅ 数据库导入成功")
    
    print("4. 导入工单模块...")
    from applications.view.system import ticket
    print("✅ 工单模块导入成功")
    
    print("5. 检查辅助函数...")
    from applications.view.system.ticket import (
        _format_datetime,
        _build_ticket_query_filters,
        _process_ticket_data,
        _extract_photo_ids,
        _combine_image_references,
        _process_datetime_field,
        _create_ticket_flow,
        _initialize_ticket_sla
    )
    print("✅ 所有辅助函数导入成功")
    
    print("6. 检查save函数...")
    from applications.view.system.ticket import save
    print("✅ save函数导入成功")
    
    print("\n✅ 所有测试通过！代码没有语法错误。")
    sys.exit(0)
    
except Exception as e:
    print(f"❌ 错误: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)