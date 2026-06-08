from flask import Blueprint
from applications.view.api.ticket import bp as ticket_api_bp
from applications.view.api.notification import bp as notification_api_bp
from applications.view.api.public_ticket import public_ticket_bp
from applications.extensions import csrf

# 创建 API 蓝图
api_bp = Blueprint('api', __name__, url_prefix='/api')


def register_api_bps(app):
    """注册 API 蓝图"""
    api_bp.register_blueprint(ticket_api_bp)
    api_bp.register_blueprint(notification_api_bp)
    app.register_blueprint(api_bp)

    # 客户公开提单/查询接口不依赖登录态，豁免 CSRF。
    csrf.exempt(public_ticket_bp)
    app.register_blueprint(public_ticket_bp)
