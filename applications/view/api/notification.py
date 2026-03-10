from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime
from applications.extensions import db
from applications.models import User
from applications.common.utils.http import success_api, fail_api

bp = Blueprint('notification', __name__, url_prefix='/notification')

notifications_db = {}

ticket_handled_status = {}

@bp.route('/list', methods=['GET'])
@login_required
def get_notifications():
    """获取当前用户的消息通知列表"""
    user_id = current_user.id
    user_notifications = notifications_db.get(user_id, [])
    
    # 按时间倒序排列
    user_notifications.sort(key=lambda x: x.get('create_time', ''), reverse=True)
    
    return success_api(data={
        'notifications': user_notifications,
        'unread_count': len([n for n in user_notifications if not n.get('is_read', False)])
    })

@bp.route('/send', methods=['POST'])
@login_required
def send_notification():
    """发送消息通知（内部使用）"""
    data = request.get_json()
    
    user_id = data.get('user_id')
    user_name = data.get('user_name')
    title = data.get('title')
    content = data.get('content')
    notification_type = data.get('type', 'info')
    
    print(f"[通知API] 收到发送请求: user_id={user_id}, user_name={user_name}, title={title}")
    
    # 如果提供了用户名，查找用户ID
    if user_name and not user_id:
        print(f"[通知API] 通过用户名查找用户: {user_name}")
        user = User.query.filter_by(realname=user_name).first()
        if not user:
            # 尝试用username查找
            user = User.query.filter_by(username=user_name).first()
        if user:
            user_id = user.id
            print(f"[通知API] 找到用户: {user.username}, ID: {user_id}")
        else:
            print(f"[通知API] 未找到用户: {user_name}")
    
    if not user_id or not title:
        return fail_api(msg='参数错误：需要提供用户ID或用户名，以及标题')
    
    # 创建消息
    notification = {
        'id': len(notifications_db.get(user_id, [])) + 1,
        'title': title,
        'content': content,
        'type': notification_type,
        'create_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'is_read': False,
        'is_handled': False
    }
    
    # 保存到内存
    if user_id not in notifications_db:
        notifications_db[user_id] = []
    notifications_db[user_id].append(notification)
    
    return success_api(msg='发送成功', data=notification)

@bp.route('/read/<int:notification_id>', methods=['POST'])
@login_required
def mark_as_read(notification_id):
    """标记消息为已读"""
    user_id = current_user.id
    user_notifications = notifications_db.get(user_id, [])
    
    for notification in user_notifications:
        if notification.get('id') == notification_id:
            notification['is_read'] = True
            return success_api(msg='标记成功')
    
    return fail_api(msg='消息不存在')

@bp.route('/clear', methods=['POST'])
@login_required
def clear_notifications():
    """清空当前用户的消息"""
    user_id = current_user.id
    if user_id in notifications_db:
        notifications_db[user_id] = []
    
    return success_api(msg='清空成功')

@bp.route('/handle/<int:ticket_id>', methods=['POST'])
@login_required
def mark_as_handled(ticket_id):
    """标记工单通知为已处理"""
    user_id = current_user.id
    
    if user_id not in ticket_handled_status:
        ticket_handled_status[user_id] = {}
    
    ticket_handled_status[user_id][ticket_id] = {
        'is_handled': True,
        'handled_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    return success_api(msg='已标记为已处理')

@bp.route('/revoke/<int:ticket_id>', methods=['POST'])
@login_required
def revoke_handled(ticket_id):
    """撤回已处理状态"""
    user_id = current_user.id
    
    if user_id in ticket_handled_status and ticket_id in ticket_handled_status[user_id]:
        ticket_handled_status[user_id][ticket_id] = {
            'is_handled': False,
            'handled_time': None
        }
        return success_api(msg='已撤回处理状态')
    
    return success_api(msg='已撤回处理状态')

@bp.route('/status/<int:ticket_id>', methods=['GET'])
@login_required
def get_ticket_status(ticket_id):
    """获取工单通知的处理状态"""
    user_id = current_user.id
    
    if user_id in ticket_handled_status and ticket_id in ticket_handled_status[user_id]:
        return success_api(data=ticket_handled_status[user_id][ticket_id])
    
    return success_api(data={'is_handled': False, 'handled_time': None})

# 获取用户ID的辅助函数
def get_user_id_by_name(username):
    """根据用户名获取用户ID"""
    user = User.query.filter_by(username=username).first()
    if user:
        return user.id
    return None

# 发送升级通知的辅助函数
def send_escalation_notification(user_id, ticket_id, ticket_title, priority, hours, action):
    """发送工单升级通知"""
    title = f"工单升级提醒 - {priority}"
    content = f"工单【{ticket_title}】已达到{hours}小时升级节点，需要{action}"
    
    notification = {
        'id': len(notifications_db.get(user_id, [])) + 1,
        'title': title,
        'content': content,
        'type': 'warning',
        'ticket_id': ticket_id,
        'create_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'is_read': False,
        'is_handled': False
    }
    
    if user_id not in notifications_db:
        notifications_db[user_id] = []
    notifications_db[user_id].append(notification)
    
    return notification
