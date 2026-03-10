import logging
import os
from datetime import timedelta


class BaseConfig:
    # 超级管理员账号
    SUPERADMIN = 'admin'

    # 系统名称
    SYSTEM_NAME = '利谱工单系统'

    # 主题面板的链接列表配置
    SYSTEM_PANEL_LINKS = [
        {
            "icon": "layui-icon layui-icon-auz",
            "title": "官方网站",
            "href": "http://www.pearadmin.com"
        },
        {
            "icon": "layui-icon layui-icon-auz",
            "title": "开发文档",
            "href": "http://www.pearadmin.com"
        },
        {
            "icon": "layui-icon layui-icon-auz",
            "title": "开源地址",
            "href": "https://gitee.com/Jmysy/Pear-Admin-Layui"
        }
    ]

    # 上传图片目标文件夹
    UPLOADED_PHOTOS_DEST = 'static/upload'
    UPLOADED_FILES_ALLOW = ['gif', 'jpg', 'jpeg', 'png', 'webp']
    UPLOADS_AUTOSERVE = True

    # JSON 配置
    JSON_AS_ASCII = False

    # 配置多个数据库连接的连接串写法示例
    # HOSTNAME: 指数据库的IP地址、USERNAME：指数据库登录的用户名、PASSWORD：指数据库登录密码、PORT：指数据库开放的端口、DATABASE：指需要连接的数据库名称
    # MSSQL:    f"mssql+pymssql://{USERNAME}:{PASSWORD}@{HOSTNAME}:{PORT}/{DATABASE}?charset=cp936"
    # MySQL:    f"mysql+pymysql://{USERNAME}:{PASSWORD}@{HOSTNAME}:{PORT}/{DATABASE}?charset=utf8mb4"
    # Oracle:   f"oracle+cx_oracle://{USERNAME}:{PASSWORD}@{HOSTNAME}:{PORT}/{DATABASE}"
    # SQLite    "sqlite:/// database.db"
    # Postgres f"postgresql+psycopg2://{USERNAME}:{PASSWORD}@{HOSTNAME}:{PORT}/{DATABASE}"
    # Oracle的第二种连接方式
    # dsnStr = cx_Oracle.makedsn({HOSTNAME}, 1521, service_name='orcl')
    # connect_str = "oracle://%s:%s@%s" % ('{USERNAME}', ' {PASSWORD}', dsnStr)

    #  在SQLALCHEMY_BINDS 中设置：'{数据库连接别名}': '{连接串}'
    # 最后在models的数据模型class中，在__tablename__前设置        __bind_key__ = '{数据库连接别名}'  即可，表示该数据模型不使用默认的数据库连接，改用“SQLALCHEMY_BINDS”中设置的其他数据库连接
    #  SQLALCHEMY_BINDS = {
    #    'testMySQL': 'mysql+pymysql://test:123456@192.168.1.1:3306/test?charset=utf8',
    #    'testMsSQL': 'mssql+pymssql://test:123456@192.168.1.1:1433/test?charset=cp936',
    #    'testOracle': 'oracle+cx_oracle://test:123456@192.168.1.1:1521/test',
    #    'testSQLite': 'sqlite:///database.db
    # }

    # 添加时区配置
    TIME_ZONE = 'Asia/Shanghai'

    # 数据库的配置信息
    SQLALCHEMY_DATABASE_URI = 'sqlite:///../pear01.db'

    # 默认日志等级
    LOG_LEVEL = logging.DEBUG

    # 日志格式配置
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'

    # 日志文件配置
    LOG_FILE = 'logs/pear-admin.log'
    LOG_MAX_BYTES = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT = 5
    LOG_FILE_LEVEL = logging.INFO

    # 发信设置
    MAIL_SERVER = 'smtp.qq.com'
    MAIL_USE_TLS = False
    MAIL_USE_SSL = True
    MAIL_PORT = 465
    MAIL_USERNAME = '123@qq.com'
    MAIL_PASSWORD = 'XXXXX'
    MAIL_DEFAULT_SENDER = MAIL_USERNAME

    # 插件配置，填写插件的文件名名称，默认不启用插件。
    PLUGIN_ENABLE_FOLDERS = []

    # Session 设置
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)

    SESSION_TYPE = 'filesystem'
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True

    SECRET_KEY = 'pear-system-flask'
