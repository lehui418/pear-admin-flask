from flask_login import LoginManager
from flask import jsonify, request


def init_login_manager(app):
    login_manager = LoginManager()
    login_manager.init_app(app)

    login_manager.login_view = 'system.passport.login'
    
    # 自定义未授权处理，对于AJAX请求返回JSON错误
    @login_manager.unauthorized_handler
    def unauthorized():
        # 检查是否为AJAX请求（兼容新旧版本Flask）
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest' or \
                 request.is_json or \
                 request.args.get('format') == 'json'
        
        if is_ajax:
            return jsonify({
                'code': 401,
                'msg': '未授权访问，请先登录',
                'data': None
            }), 401
        else:
            # 非AJAX请求，正常重定向到登录页面
            from flask import redirect, url_for
            return redirect(url_for('system.passport.login'))

    @login_manager.user_loader
    def load_user(user_id):
        from applications.models import User
        user = User.query.get(int(user_id))
        return user
