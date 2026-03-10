import os
from flask import current_app
from sqlalchemy import desc
from applications.extensions import db
from applications.extensions.init_upload import photos
from applications.models import Photo
from applications.schemas import PhotoOutSchema
from applications.common.curd import model_to_dicts


def get_photo(page, limit):
    photo = Photo.query.order_by(desc(Photo.create_time)).paginate(page=page, per_page=limit, error_out=False)
    count = Photo.query.count()
    data = model_to_dicts(schema=PhotoOutSchema, data=photo.items)
    return data, count


def upload_one(photo, mime):
    # 读取图片数据
    image_data = photo.read()
    # 生成唯一文件名
    import uuid
    filename = str(uuid.uuid4()) + '.' + photo.filename.split('.')[-1]
    # 创建虚拟URL路径（实际不存在文件，但保持兼容性）
    file_url = '/_uploads/photos/' + filename
    # 计算图片大小
    size = len(image_data)
    # 创建Photo对象，包含图片数据
    photo_obj = Photo(name=filename, href=file_url, mime=mime, size=str(size), image_data=image_data)
    db.session.add(photo_obj)
    db.session.commit()
    # 返回图片ID和URL
    return file_url, photo_obj.id


def delete_photo_by_id(_id):
    photo_obj = Photo.query.filter_by(id=_id).first()
    if not photo_obj:
        return None  # 图片不存在
    photo_name = photo_obj.name
    photo = Photo.query.filter_by(id=_id).delete()
    db.session.commit()
    upload_url = current_app.config.get("UPLOADED_PHOTOS_DEST")
    file_path = upload_url + '/' + photo_name
    if os.path.exists(file_path):
        os.remove(file_path)
    return photo
