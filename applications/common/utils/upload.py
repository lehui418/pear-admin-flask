import io
import os
import uuid

from flask import current_app
from PIL import Image, UnidentifiedImageError
from sqlalchemy import desc
from werkzeug.utils import secure_filename

from applications.common.curd import model_to_dicts
from applications.extensions import db
from applications.models import Photo
from applications.schemas import PhotoOutSchema


def get_photo(page, limit):
    photo = Photo.query.order_by(desc(Photo.create_time)).paginate(
        page=page, per_page=limit, error_out=False
    )
    count = Photo.query.count()
    data = model_to_dicts(schema=PhotoOutSchema, data=photo.items)
    return data, count


def _validate_image_upload(photo, mime):
    if photo is None or not getattr(photo, "filename", None):
        raise ValueError("未接收到有效文件")

    original_name = secure_filename(photo.filename)
    if "." not in original_name:
        raise ValueError("文件名缺少扩展名")

    ext = original_name.rsplit(".", 1)[1].lower()
    allowed_exts = {"jpg", "jpeg", "png", "gif", "webp", "bmp"}
    if ext not in allowed_exts:
        raise ValueError("不支持的文件扩展名")

    allowed_mimes = {
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
    }
    if mime not in allowed_mimes:
        raise ValueError("不支持的文件类型")

    image_data = photo.read()
    max_size = int(current_app.config.get("MAX_UPLOAD_SIZE", 5 * 1024 * 1024))
    if not image_data:
        raise ValueError("空文件不允许上传")
    if len(image_data) > max_size:
        raise ValueError("文件过大，超过限制")

    try:
        with Image.open(io.BytesIO(image_data)) as img:
            img.verify()
    except (UnidentifiedImageError, OSError, ValueError):
        raise ValueError("文件内容不是有效图片")

    return image_data, ext


def upload_one(photo, mime):
    image_data, ext = _validate_image_upload(photo, mime)
    filename = f"{uuid.uuid4()}.{ext}"
    file_url = f"/_uploads/photos/{filename}"
    size = len(image_data)

    photo_obj = Photo(
        name=filename, href=file_url, mime=mime, size=str(size), image_data=image_data
    )
    db.session.add(photo_obj)
    db.session.commit()
    return file_url, photo_obj.id


def delete_photo_by_id(_id):
    photo_obj = Photo.query.filter_by(id=_id).first()
    if not photo_obj:
        return None

    photo_name = photo_obj.name
    photo = Photo.query.filter_by(id=_id).delete()
    db.session.commit()

    upload_url = current_app.config.get("UPLOADED_PHOTOS_DEST")
    file_path = upload_url + "/" + photo_name
    if os.path.exists(file_path):
        os.remove(file_path)
    return photo
