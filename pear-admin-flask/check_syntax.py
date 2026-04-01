#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
检查ticket.py语法
"""
import ast
import sys

try:
    print("正在检查 ticket.py 语法...")
    
    with open('applications/view/system/ticket.py', 'r', encoding='utf-8') as f:
        code = f.read()
    
    ast.parse(code)
    print("✅ ticket.py 语法检查通过")
    
    # 检查辅助函数是否存在
    functions = [
        '_format_datetime',
        '_build_ticket_query_filters', 
        '_process_ticket_data',
        '_extract_photo_ids',
        '_combine_image_references',
        '_process_datetime_field',
        '_create_ticket_flow',
        '_initialize_ticket_sla'
    ]
    
    print("\n检查辅助函数...")
    for func_name in functions:
        if func_name in code:
            print(f"✅ {func_name} 存在")
        else:
            print(f"❌ {func_name} 不存在")
    
    # 检查save函数
    if 'def save():' in code:
        print("✅ save() 函数存在")
        
        # 检查是否使用了辅助函数
        if '_extract_photo_ids(' in code and 'def _extract_photo_ids' in code:
            print("✅ save() 函数使用了 _extract_photo_ids() 辅助函数")
        else:
            print("⚠️ save() 函数可能没有使用 _extract_photo_ids() 辅助函数")
            
        if '_process_datetime_field(' in code and 'def _process_datetime_field' in code:
            print("✅ save() 函数使用了 _process_datetime_field() 辅助函数")
        else:
            print("⚠️ save() 函数可能没有使用 _process_datetime_field() 辅助函数")
            
        if '_combine_image_references(' in code and 'def _combine_image_references' in code:
            print("✅ save() 函数使用了 _combine_image_references() 辅助函数")
        else:
            print("⚠️ save() 函数可能没有使用 _combine_image_references() 辅助函数")
            
        if '_create_ticket_flow(' in code and 'def _create_ticket_flow' in code:
            print("✅ save() 函数使用了 _create_ticket_flow() 辅助函数")
        else:
            print("⚠️ save() 函数可能没有使用 _create_ticket_flow() 辅助函数")
            
        if '_initialize_ticket_sla(' in code and 'def _initialize_ticket_sla' in code:
            print("✅ save() 函数使用了 _initialize_ticket_sla() 辅助函数")
        else:
            print("⚠️ save() 函数可能没有使用 _initialize_ticket_sla() 辅助函数")
    
    print("\n✅ 所有检查完成！")
    sys.exit(0)
    
except SyntaxError as e:
    print(f"❌ 语法错误: {e}")
    print(f"   文件: {e.filename}")
    print(f"   行号: {e.lineno}")
    print(f"   位置: {e.offset}")
    print(f"   文本: {e.text}")
    sys.exit(1)
    
except Exception as e:
    print(f"❌ 错误: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)