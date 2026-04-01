from applications.extensions import ma
from marshmallow import fields


class PhotoOutSchema(ma.Schema):
    id = fields.Integer()
    name = fields.Str()
    href = fields.Str()
    mime = fields.Str()
    size = fields.Str()
    ext = fields.Str()
    create_time = fields.DateTime()
    # 添加一个方法字段，用于获取图片的base64编码数据
    base64_data = fields.Method("get_base64_data")
    
    def get_base64_data(self, obj):
        """获取图片的base64编码数据"""
        if hasattr(obj, 'get_base64_data'):
            return obj.get_base64_data()
        return None
