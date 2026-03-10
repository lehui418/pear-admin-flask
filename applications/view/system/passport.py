from flask import Blueprint, session, redirect, url_for, render_template, request
from flask_login import current_user, login_user, login_required, logout_user
import time
from sqlalchemy.orm import joinedload

from applications.common.admin import get_captcha, login_log, normal_log
from applications.common.script.admin import operation_log
from applications.common.utils.http import fail_api, success_api, table_api
from applications.models import User

bp = Blueprint('passport', __name__, url_prefix='/passport')


# 获取验证码
@bp.get('/getCaptcha')
def captcha():
    resp, code = get_captcha()
    session["code"] = code
    return resp


# 调试验证码 - 仅用于开发环境
@bp.get('/debug_captcha')
def debug_captcha():
    """调试验证码接口，仅用于开发环境"""
    # 这里可以添加环境检查，确保只在开发环境可用
    code = session.get("code", "")
    return table_api(msg="当前验证码", data=code)


# 登录
@bp.get('/login')
def login():
    if current_user.is_authenticated:
        return redirect(url_for('system.workboard.main'))
    return render_template('system/login.html')


# 登录
@bp.post('/login')
def login_post():
    req = request.form
    username = req.get('username')
    password = req.get('password')
    remember = bool(req.get('remember-me'))
    code = req.get('captcha', '').lower()

    if not username or not password or not code:
        return fail_api(msg="用户名或密码没有输入")
    s_code = session.get("code", None)
    session["code"] = None

    if not all([code, s_code]):
        return fail_api(msg="参数错误")

    if code != s_code:
        return fail_api(msg="验证码错误")
    user = User.query.filter_by(username=username).first()

    if not user:
        return fail_api(msg="不存在的用户")

    if user.enable == 0:
        return fail_api(msg="用户被暂停使用")

    if username == user.username and user.validate_password(password):
        # 登录
        login_user(user, remember=remember)
        # 记录登录日志
        login_log(request, uid=user.id, is_access=True)
        # 授权路由存入session
        role = current_user.role
        user_power = []
        for i in role:
            if i.enable == 0:
                continue
            for p in i.power:
                if p.enable == 0:
                    continue
                user_power.append(p.code)
        session['permissions'] = user_power
        # # 角色存入session
        # roles = []
        # for role in current_user.role.all():
        #     roles.append(role.id)
        # session['role'] = [roles]

        # 记录登录时间，用于心跳检测
        session['last_activity'] = int(time.time())

        return success_api(msg="登录成功")

    login_log(request, uid=user.id, is_access=False)
    return fail_api(msg="用户名或密码错误")


# 心跳检测接口 - 用于保持会话活跃
@bp.get('/heartbeat')
@login_required
def heartbeat():
    """心跳检测接口，用于保持会话活跃"""
    # 更新会话时间戳
    session['last_activity'] = int(time.time())
    return success_api(msg="心跳正常")


# 检查会话状态
@bp.get('/check_session')
@login_required
def check_session():
    """检查会话状态"""
    last_activity = session.get('last_activity', 0)
    current_time = int(time.time())
    
    # 如果超过30分钟无活动，提示即将过期
    if current_time - last_activity > 30 * 60:
        return fail_api(msg="会话即将过期", code=419)
    
    return success_api(msg="会话正常")


# 退出登录
@bp.post('/logout')
@login_required
def logout():
    # 手动记录登出日志
    normal_log(
        method=request.method,
        url=request.path,
        ip=request.remote_addr,
        user_agent=request.headers.get('User-Agent'),
        desc=f"用户 [{current_user.username}] 退出登录",
        uid=current_user.id,
        is_access=True
    )
    logout_user()
    if 'permissions' in session:
        session.pop('permissions')
    return success_api(msg="注销成功")
