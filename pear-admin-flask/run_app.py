#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
启动应用并显示输出
"""
import subprocess
import sys
import time

print("正在启动应用...")
print("=" * 50)

# 启动应用
process = subprocess.Popen(
    [sys.executable, 'app.py'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    bufsize=1,
    universal_newlines=True
)

# 等待一段时间让应用启动
time.sleep(5)

# 检查进程状态
if process.poll() is None:
    print("✅ 应用正在运行...")
    print("✅ 进程ID:", process.pid)
    print("=" * 50)
    print("应用已成功启动！")
    print("您可以在浏览器中访问: http://localhost:5000")
    print("=" * 50)
    
    # 保持进程运行
    try:
        process.wait()
    except KeyboardInterrupt:
        print("\n正在停止应用...")
        process.terminate()
        process.wait()
        print("应用已停止")
else:
    # 进程已经退出，读取输出
    stdout, stderr = process.communicate()
    
    if stdout:
        print("标准输出:")
        print(stdout)
    
    if stderr:
        print("标准错误:")
        print(stderr)
    
    print(f"退出码: {process.returncode}")
    
    if process.returncode != 0:
        print("❌ 应用启动失败")
        sys.exit(1)
    else:
        print("✅ 应用已正常退出")
        sys.exit(0)