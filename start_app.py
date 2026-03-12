import sys
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

try:
    print("=" * 50)
    print("正在启动应用...")
    print("=" * 50)
    
    from applications import create_app
    app = create_app()
    
    print("\n✅ 应用创建成功！")
    print(f"调试模式: {app.config.get('DEBUG')}")
    print(f"数据库: {app.config.get('SQLALCHEMY_DATABASE_URI')}")
    print("\n正在启动服务器...")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
    
except Exception as e:
    print(f"\n❌ 启动失败: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
