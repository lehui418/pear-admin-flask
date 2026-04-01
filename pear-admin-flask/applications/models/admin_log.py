import datetime
from applications.extensions import db
from sqlalchemy import func

class OperationLog(db.Model):
    __tablename__ = 'admin_log'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='日志ID')
    method = db.Column(db.String(10), comment='请求方法')
    uid = db.Column(db.Integer, comment='用户ID')
    url = db.Column(db.String(255), comment='URL地址')
    desc = db.Column(db.String(255), comment='描述')
    ip = db.Column(db.String(255), comment='IP地址')
    user_agent = db.Column(db.String(255), comment='User-Agent')
    content_type = db.Column(db.String(255), comment='Content-Type')
    success = db.Column(db.Integer, comment='是否成功(1=成功，0=失败)', default=1)
    # 修改时间字段默认值，使用应用层时间而非数据库时间
    create_time = db.Column(db.DateTime, default=datetime.datetime.now, comment='创建时间')
    
    def __repr__(self):
        return f'<OperationLog {self.id}>'