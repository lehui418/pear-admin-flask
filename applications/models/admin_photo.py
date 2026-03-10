import datetime
import base64
from applications.extensions import db


class Photo(db.Model):
    __tablename__ = 'admin_photo'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    href = db.Column(db.String(255))
    mime = db.Column(db.CHAR(50), nullable=False)
    size = db.Column(db.CHAR(30), nullable=False)
    # 添加图片数据字段，用于存储图片的二进制数据
    image_data = db.Column(db.LargeBinary, nullable=True)
    create_time = db.Column(db.DateTime, default=datetime.datetime.now)
    
    def get_base64_data(self):
        """返回图片的base64编码，用于在HTML中直接显示"""
        if self.image_data:
            return f"data:{self.mime};base64,{base64.b64encode(self.image_data).decode('utf-8')}"
        return None