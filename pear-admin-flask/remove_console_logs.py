#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
批量注释掉 workboard_main.js 中的 console.log 调试语句
"""

import re

def remove_console_logs(file_path):
    """注释掉 JS 文件中的 console.log 语句"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 统计原始 console.log 数量
    original_count = len(re.findall(r'console\.(log|debug|info)\(', content))
    
    # 匹配 console.log/debug/info 语句（包括多行）
    # 保留 console.error 和 console.warn
    pattern = r'(^\s*)console\.(log|debug|info)\((.*?)\);?'
    
    def replace_log(match):
        indent = match.group(1)
        log_content = match.group(3)
        # 注释掉这行
        return f'{indent}// console.{match.group(2)}({log_content});'
    
    # 使用 re.DOTALL 让 . 匹配换行符
    new_content = re.sub(pattern, replace_log, content, flags=re.MULTILINE | re.DOTALL)
    
    # 统计修改后的数量
    new_count = len(re.findall(r'console\.(log|debug|info)\(', new_content))
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f'✅ 已处理文件: {file_path}')
    print(f'   原始 console.log/debug/info 数量: {original_count}')
    print(f'   剩余数量: {new_count}')
    print(f'   已注释: {original_count - new_count}')
    
    return original_count - new_count

if __name__ == '__main__':
    file_path = 'static/js/workboard/workboard_main.js'
    count = remove_console_logs(file_path)
    print(f'\n总计注释了 {count} 个调试日志语句')
