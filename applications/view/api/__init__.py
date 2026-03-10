from flask import Blueprint
from applications.view.api.ticket import bp as ticket_api_bp
from applications.view.api.notification import bp as notification_api_bp

# 创建API蓝图
api_bp = Blueprint('api', __name__, url_prefix='/api')

def register_api_bps(app):
    """注册API蓝图"""
    api_bp.register_blueprint(ticket_api_bp)
    api_bp.register_blueprint(notification_api_bp)
    app.register_blueprint(api_bp)