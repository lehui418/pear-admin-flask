import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask
from applications.common.script import init_script
from applications.config import BaseConfig
from applications.extensions import init_plugs
from applications.view import init_bps
# 蓝图导入已移至 applications/view/system/__init__.py 文件中


def create_app():
    app = Flask(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

    # 引入配置
    app.config.from_object(BaseConfig)

    # 配置日志记录
    configure_logging(app)

    # 注册flask组件
    init_plugs(app)

    # 注册蓝图
    init_bps(app)

    # 注册命令
    init_script(app)

    # 添加全局响应处理 - 禁用浏览器缓存
    @app.after_request
    def disable_cache(response):
        """禁用浏览器缓存，确保AJAX请求获取最新数据"""
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response

    return app



def configure_logging(app):
    # 创建日志目录
    log_dir = os.path.join(app.root_path, 'logs')
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    # 设置日志级别
    logging.basicConfig(level=app.config['LOG_LEVEL'])

    # 配置控制台日志处理器
    console_handler = logging.StreamHandler()
    console_handler.setLevel(app.config['LOG_LEVEL'])

    # 配置文件日志处理器
    file_handler = RotatingFileHandler(
        filename=os.path.join(log_dir, 'pear-admin.log'),
        maxBytes=app.config.get('LOG_MAX_BYTES', 10*1024*1024),
        backupCount=app.config.get('LOG_BACKUP_COUNT', 5),
        encoding='utf-8'
    )
    file_handler.setLevel(app.config.get('LOG_FILE_LEVEL', logging.INFO))

    # 创建日志格式器
    formatter = logging.Formatter(
        fmt=app.config.get('LOG_FORMAT', '%(asctime)s - %(name)s - %(levelname)s - %(message)s'),
        datefmt=app.config.get('LOG_DATE_FORMAT', '%Y-%m-%d %H:%M:%S')
    )

    # 为处理器设置格式器
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)

    # 获取根日志记录器
    root_logger = logging.getLogger()

    # 清空根日志记录器的处理器（避免重复日志）
    root_logger.handlers = []

    # 为根日志记录器添加处理器
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)

    # 设置 werkzeug 日志级别
    werkzeug_logger = logging.getLogger('werkzeug')
    werkzeug_logger.setLevel(app.config['LOG_LEVEL'])

    # 记录应用启动日志
    app.logger.info('应用已启动')
