import io

from flask import Blueprint, current_app, jsonify, request, send_file

from applications.common.utils import upload as upload_curd
from applications.common.utils.rights import authorize
from applications.extensions import db
from applications.models import Photo

bp = Blueprint("adminUpload", __name__, url_prefix="/upload")


@bp.post("/image")
@authorize("system:file:add", log=True)
def upload_image():
    if "file" not in request.files:
        return jsonify({"msg": "未接收到文件", "code": 1, "success": False})

    photo = request.files["file"]
    mime = photo.content_type

    try:
        file_url, photo_id = upload_curd.upload_one(photo=photo, mime=mime)
        return jsonify(
            {
                "msg": "上传成功",
                "code": 0,
                "success": True,
                "data": {"url": file_url, "photo_id": photo_id},
            }
        )
    except Exception as e:
        current_app.logger.warning(f"上传失败: {str(e)}")
        return jsonify(
            {"msg": "上传失败，请检查文件格式和大小", "code": 1, "success": False}
        )


@bp.get("/image/<int:photo_id>")
@authorize("system:file:main")
def get_image(photo_id):
    photo = db.session.get(Photo, photo_id)
    if not photo or not photo.image_data:
        return (
            jsonify({"msg": "图片不存在或数据为空", "code": 1, "success": False}),
            404,
        )

    image_io = io.BytesIO(photo.image_data)
    return send_file(
        image_io, mimetype=photo.mime, as_attachment=False, download_name=photo.name
    )


@bp.get("/image_base64/<int:photo_id>")
@authorize("system:file:main")
def get_image_base64(photo_id):
    photo = db.session.get(Photo, photo_id)
    if not photo or not photo.image_data:
        return (
            jsonify({"msg": "图片不存在或数据为空", "code": 1, "success": False}),
            404,
        )

    return jsonify(
        {
            "msg": "获取成功",
            "code": 0,
            "success": True,
            "data": {"base64": photo.get_base64_data(), "mime": photo.mime},
        }
    )
