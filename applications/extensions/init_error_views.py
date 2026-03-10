from flask import render_template, request
import traceback

def init_error_views(app):
    @app.errorhandler(403)
    def page_forbidden(e):
        app.logger.warning(f"403 Forbidden: {request.path} - IP: {request.remote_addr}")
        return render_template('errors/403.html'), 403

    @app.errorhandler(404)
    def page_not_found(e):
        app.logger.warning(f"404 Not Found: {request.path} - IP: {request.remote_addr}")
        return render_template('errors/404.html'), 404

    @app.errorhandler(500)
    def internal_server_error(e):
        # 记录详细的错误信息到终端和日志文件
        app.logger.error(f"500 Internal Server Error: {request.path} - IP: {request.remote_addr}", exc_info=True)
        if app.debug:
            # 调试模式下显示详细错误信息
            return traceback.format_exc(), 500
        return render_template('errors/500.html'), 500