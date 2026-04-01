from flask import Blueprint, request, render_template
from sqlalchemy import desc
from applications.common.utils.http import table_api
from applications.common.utils.rights import authorize
from applications.models import OperationLog, User
from applications.extensions import db
from applications.schemas import OperationLogSchema
from applications.common.curd import model_to_dicts
from flask_login import login_required

bp = Blueprint('log', __name__, url_prefix='/log')


# 日志管理
@bp.get('/')
@authorize("system:log:main")
def main():
    return render_template('system/admin_log/main.html')


# 登录日志
@bp.get('/loginLog')
@authorize("system:log:main")
def login_log():
    # 获取请求参数
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    url = request.args.get('url', '')
    ip = request.args.get('ip', '')
    
    # 创建查询，并关联User表
    query = db.session.query(OperationLog, User.username).join(
        User, OperationLog.uid == User.id
    ).filter(OperationLog.url == '/system/passport/login')
    
    # 应用筛选条件
    if url:
        query = query.filter(OperationLog.url.like(f"%{url}%"))
    if ip:
        query = query.filter(OperationLog.ip.like(f"%{ip}%"))
    
    # 执行查询
    log = query.order_by(desc(OperationLog.create_time)).layui_paginate(page=page, limit=limit)
    count = log.total
    
    # 格式化数据
    data = []
    for log_item, username in log.items:
        item_dict = {
            "id": log_item.id,
            "username": username,
            "method": log_item.method,
            "url": log_item.url,
            "desc": log_item.desc,
            "ip": log_item.ip,
            "success": log_item.success,
            "create_time": log_item.create_time.strftime("%Y-%m-%d %H:%M:%S") if log_item.create_time else ""
        }
        data.append(item_dict)

    return table_api(data=data, count=count)


# 操作日志
@bp.get('/operateLog')
@authorize("system:log:main")
def operate_log():
    # 获取请求参数
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    url = request.args.get('url', '')
    ip = request.args.get('ip', '')
    
    # 创建查询，并关联User表
    query = db.session.query(OperationLog, User.username).join(
        User, OperationLog.uid == User.id
    ).filter(OperationLog.url != '/system/passport/login')
    
    # 应用筛选条件
    if url:
        query = query.filter(OperationLog.url.like(f"%{url}%"))
    if ip:
        query = query.filter(OperationLog.ip.like(f"%{ip}%"))
    
    # 执行查询
    log = query.order_by(desc(OperationLog.create_time)).layui_paginate(page=page, limit=limit)
    count = log.total

    # 格式化数据
    data = []
    for log_item, username in log.items:
        item_dict = {
            "id": log_item.id,
            "username": username,
            "method": log_item.method,
            "url": log_item.url,
            "desc": log_item.desc,
            "ip": log_item.ip,
            "success": log_item.success,
            "create_time": log_item.create_time.strftime("%Y-%m-%d %H:%M:%S") if log_item.create_time else ""
        }
        data.append(item_dict)

    return table_api(data=data, count=count)


@bp.get('/data')
@authorize("system:log:main")
def data():
    # 获取请求参数
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    url = request.args.get('url', '')
    ip = request.args.get('ip', '')
    username = request.args.get('username', '')

    # 创建查询，并关联User表
    query = db.session.query(OperationLog, User.username).join(
        User, OperationLog.uid == User.id
    )
    
    # 应用筛选条件
    if url:
        query = query.filter(OperationLog.url.like(f"%{url}%"))
    if ip:
        query = query.filter(OperationLog.ip.like(f"%{ip}%"))
    if username:
        query = query.filter(User.username.like(f"%{username}%"))

    # 执行查询
    log = query.order_by(desc(OperationLog.create_time)).layui_paginate(page=page, limit=limit)
    count = log.total

    # 格式化数据
    data = []
    for log_item, username in log.items:
        item_dict = {
            "id": log_item.id,
            "username": username,
            "method": log_item.method,
            "url": log_item.url,
            "desc": log_item.desc,
            "ip": log_item.ip,
            "success": log_item.success,
            "create_time": log_item.create_time.strftime("%Y-%m-%d %H:%M:%S") if log_item.create_time else ""
        }
        data.append(item_dict)

    return table_api(data=data, count=count)
