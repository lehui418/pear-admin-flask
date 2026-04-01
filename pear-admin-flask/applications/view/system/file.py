import os
from flask import Blueprint, request, render_template, jsonify, current_app

from applications.common.utils.http import fail_api, success_api, table_api
from applications.common.utils.rights import authorize
from applications.extensions import db
from applications.models import Photo
from applications.common.utils import upload as upload_curd

bp = Blueprint('adminFile', __name__, url_prefix='/file')


#  图片管理
@bp.get('/')
@authorize("system:file:main")
def index():
    return render_template('system/photo/photo.html')


#  图片数据
@bp.get('/table')
@authorize("system:file:main")
def table():
    page = request.args.get('page', type=int)
    limit = request.args.get('limit', type=int)
    data, count = upload_curd.get_photo(page=page, limit=limit)
    return table_api(data=data, count=count)


#   上传
@bp.get('/upload')
@authorize("system:file:add", log=True)
def upload():
    return render_template('system/photo/photo_add.html')


#   上传接口
@bp.post('/upload')
@authorize("system:file:add", log=True)
def upload_api():
    if 'file' in request.files:
        photo = request.files['file']
        mime = request.files['file'].content_type

        file_url = upload_curd.upload_one(photo=photo, mime=mime)
        res = {
            "msg": "上传成功",
            "code": 0,
            "success": True,
            "data":
                {"src": file_url}
        }
        return jsonify(res)
    return fail_api()


#    图片删除
@bp.route('/delete', methods=['GET', 'POST'])
@authorize("system:file:delete", log=True)
def delete():
    _id = request.form.get('id')
    res = upload_curd.delete_photo_by_id(_id)
    if res:
        return success_api(msg="删除成功")
    else:
        return fail_api(msg="删除失败")


# 图片批量删除
@bp.route('/batchRemove', methods=['GET', 'POST'])
@authorize("system:file:delete", log=True)
def batch_remove():
    ids = request.form.getlist('ids[]')
    photo_name = Photo.query.filter(Photo.id.in_(ids)).all()
    upload_url = current_app.config.get("UPLOADED_PHOTOS_DEST")
    
    # 获取上传目录的绝对路径
    upload_path = os.path.abspath(upload_url)
    
    for p in photo_name:
        # 验证文件名不为空
        if not p.name or p.name.strip() == '':
            current_app.logger.warning("检测到空文件名")
            return fail_api(msg="非法文件名")
        
        # 验证文件名不包含路径遍历字符
        if '..' in p.name or '/' in p.name or '\\' in p.name:
            current_app.logger.warning(f"检测到非法文件名: {p.name}")
            return fail_api(msg="非法文件名")
        
        # 安全地构建文件路径
        file_path = os.path.abspath(os.path.join(upload_path, p.name))
        
        # 验证文件路径是否在允许的目录范围内（防止目录遍历攻击）
        if not file_path.startswith(upload_path):
            current_app.logger.warning(f"检测到非法文件路径: {p.name}")
            return fail_api(msg="非法文件路径")
        
        # 检查文件是否存在再删除
        if os.path.exists(file_path):
            os.remove(file_path)
    
    photo = Photo.query.filter(Photo.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    if photo:
        return success_api(msg="删除成功")
    else:
        return fail_api(msg="删除失败")

