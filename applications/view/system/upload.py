import os
from flask import Blueprint, request, jsonify, current_app, send_file, Response
from applications.common.utils.rights import authorize
from applications.common.utils import upload as upload_curd
from applications.models import Photo
from applications.extensions import db
import io

bp = Blueprint('adminUpload', __name__, url_prefix='/upload')

# 图片上传接口
@bp.post('/image')
def upload_image():
    if 'file' in request.files:
        photo = request.files['file']
        mime = request.files['file'].content_type

        # 检查是否为图片类型
        if not mime.startswith('image/'):
            return jsonify({
                "msg": "只能上传图片文件",
                "code": 1,
                "success": False
            })

        try:
            # 上传图片并获取URL和图片ID
            file_url, photo_id = upload_curd.upload_one(photo=photo, mime=mime)
            res = {
                "msg": "上传成功",
                "code": 0,
                "success": True,
                "data": {
                    "url": file_url,
                    "photo_id": photo_id  # 添加图片ID，用于后续获取图片数据
                }
            }
            return jsonify(res)
        except Exception as e:
            return jsonify({
                "msg": f"上传失败: {str(e)}",
                "code": 1,
                "success": False
            })
    
    return jsonify({
        "msg": "未接收到文件",
        "code": 1,
        "success": False
    })

# 从数据库获取图片接口
@bp.get('/image/<int:photo_id>')
def get_image(photo_id):
    """根据图片ID从数据库获取图片数据并显示"""
    photo = db.session.get(Photo, photo_id)
    if not photo or not photo.image_data:
        return jsonify({
            "msg": "图片不存在或数据为空",
            "code": 1,
            "success": False
        }), 404
    
    # 创建内存文件对象
    image_io = io.BytesIO(photo.image_data)
    # 返回图片数据
    return send_file(
        image_io,
        mimetype=photo.mime,
        as_attachment=False,
        download_name=photo.name
    )

# 获取图片的base64编码数据接口
@bp.get('/image_base64/<int:photo_id>')
def get_image_base64(photo_id):
    """根据图片ID从数据库获取图片的base64编码数据"""
    photo = db.session.get(Photo, photo_id)
    if not photo or not photo.image_data:
        return jsonify({
            "msg": "图片不存在或数据为空",
            "code": 1,
            "success": False
        }), 404
    
    # 获取base64编码数据
    base64_data = photo.get_base64_data()
    return jsonify({
        "msg": "获取成功",
        "code": 0,
        "success": True,
        "data": {
            "base64": base64_data,
            "mime": photo.mime
        }
    })