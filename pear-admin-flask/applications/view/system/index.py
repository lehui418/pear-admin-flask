from flask import Blueprint, render_template, request, redirect, url_for
from flask_login import login_required, current_user
from datetime import datetime

bp = Blueprint('index', __name__, url_prefix='/')

# 首页
@bp.get('/')
@login_required
def index():
    # 判断是否为手机访问
    user_agent = request.headers.get('User-Agent', '').lower()
    is_mobile = 'mobile' in user_agent or 'android' in user_agent or 'iphone' in user_agent
    
    # 通过URL参数强制访问移动端
    if request.args.get('mobile') == '1':
        is_mobile = True
    
    print(f"is_mobile: {is_mobile}")  # 调试输出
    
    if is_mobile:
        return render_template('mobile/index.html', now=datetime.now())
    else:
        return render_template('system/index.html')

# 移动端首页快捷入口
@bp.get('/m')
@login_required
def mobile_home():
    """移动端首页快捷入口 /m"""
    return render_template('mobile/index.html', now=datetime.now())


# 移动端首页快捷入口（可读性更好的URL）
@bp.get('/mobile')
@login_required
def mobile_home_readable():
    """移动端首页快捷入口 /mobile"""
    return render_template('mobile/index.html', now=datetime.now())

# 移动端工作看板快捷入口
@bp.get('/m/workboard')
@login_required
def mobile_workboard():
    """移动端工作看板快捷入口 /m/workboard"""
    return redirect(url_for('system.workboard.main') + '?mobile=1')

# 移动端工单记录快捷入口
@bp.get('/m/tickets')
@login_required
def mobile_tickets():
    """移动端工单记录快捷入口 /m/tickets"""
    return redirect(url_for('system.ticket.main') + '?mobile=1')

# 移动端产品建议快捷入口
@bp.get('/m/suggestions')
@login_required
def mobile_suggestions():
    """移动端产品建议快捷入口 /m/suggestions"""
    return redirect(url_for('system.product_suggestion.main') + '?mobile=1')