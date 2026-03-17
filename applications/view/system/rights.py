import os
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_, desc
import copy
from collections import OrderedDict

from flask import jsonify, current_app, Blueprint, render_template, redirect, url_for, request
from flask_login import login_required, current_user

from ...common.utils.http import table_api
from ...common.utils.rights import authorize
from applications.common.utils.validate import str_escape
from applications.common.utils.datetime_util import format_datetime
from ...models import Power, Ticket
from ...schemas import PowerOutSchema

bp = Blueprint('rights', __name__, url_prefix='/rights')


# 渲染配置
@bp.get('/configs')
@login_required
def configs():
    # 网站配置
    config = dict(logo={
        # 网站名称
        "title": current_app.config.get("SYSTEM_NAME"),
        # 网站图标
        "image": "/static/system/admin/images/logo.png"
        # 菜单配置
    }, menu={
        # 菜单数据来源
        "data": "/system/rights/menu",
        "collaspe": False,
        # 是否同时只打开一个菜单目录
        "accordion": True,
        "method": "GET",
        # 是否开启多系统菜单模式
        "control": False,
        # 顶部菜单宽度 PX
        "controlWidth": 500,
        # 默认选中的菜单项
        "select": "0",
        # 是否开启异步菜单，false 时 data 属性设置为菜单数据，false 时为 json 文件或后端接口
        "async": True
    }, tab={
        # 是否开启多选项卡
        "enable": True,
        # 切换选项卡时，是否刷新页面状态
        "keepState": True,
        # 是否开启 Tab 记忆
        "session": True,
        # 预加载
        "preload": False,
        # 最大可打开的选项卡数量
        "max": 30,
        "index": {
            # 标识 ID , 建议与菜单项中的 ID 一致
            "id": "10",
            # 页面地址
            "href": "/system/rights/welcome",
            # 标题
            "title": "首页"
        }
    }, theme={
        # 默认主题色，对应 colors 配置中的 ID 标识
        "defaultColor": "2",
        # 默认的菜单主题 dark-theme 黑 / light-theme 白
        "defaultMenu": "dark-theme",
        # 是否允许用户切换主题，false 时关闭自定义主题面板
        "allowCustom": True
    }, colors=[{
        "id": "1",
        "color": "#2d8cf0"
    },
        {
            "id": "2",
            "color": "#5FB878"
        },
        {
            "id": "3",
            "color": "#1E9FFF"
        }, {
            "id": "4",
            "color": "#FFB800"
        }, {
            "id": "5",
            "color": "darkgray"
        }
    ], links=current_app.config.get("SYSTEM_PANEL_LINKS"), other={
        # 主页动画时长
        "keepLoad": 0,
        # 布局顶部主题
        "autoHead": False
    }, header={
        'message': '/system/rights/message'
    })
    return jsonify(config)


# 消息
@bp.get('/message')
@login_required
def message():
    from applications.models import Ticket
    from datetime import datetime, timedelta
    from applications.view.api.notification import ticket_handled_status
    
    user_id = current_user.id
    username = current_user.username
    realname = current_user.realname or username
    
    allowed_users = ['史乐慧', 'fmz']
    if realname not in allowed_users and username not in allowed_users:
        return dict(code=200,
                    data=[
                        {
                            "id": 1,
                            "title": "通知",
                            "children": []
                        }
                    ])
    
    from datetime import date, datetime, time
    
    # 查询2026年3月1日以后的所有P1/P2工单（不再限制为今天创建的）
    start_date = datetime(2026, 3, 1, 0, 0, 0)
    
    all_tickets = Ticket.query.filter(
        Ticket.priority.in_(['P1', 'P2', 'High', 'Medium']),
        Ticket.create_time >= start_date
    ).all()
    
    # 调试：输出查询到的所有工单ID
    print(f"[通知] 2026年3月1日后创建的P1/P2工单数量: {len(all_tickets)}")
    print(f"[通知] 工单ID列表: {[t.id for t in all_tickets]}")
    
    # 计算哪些工单已超时
    now = datetime.now()
    notification_list = []
    
    for ticket in all_tickets:
        if not ticket.create_time:
            continue
        
        # 判断工单是否已关闭/已解决/暂时规避
        is_closed = ticket.status in ['Closed', '已关闭', '暂时规避', '已解决']
        
        # 如果工单已关闭，使用完成时间（或关闭时间）计算；否则使用当前时间
        if is_closed and ticket.completion_time:
            end_time = ticket.completion_time
        elif is_closed and ticket.update_time:
            # 如果没有完成时间，使用最后更新时间
            end_time = ticket.update_time
        else:
            end_time = now
            
        # 计算已耗时（从创建到关闭/当前的时间）
        elapsed_hours = (end_time - ticket.create_time).total_seconds() / 3600
        elapsed_minutes = elapsed_hours * 60  # 转换为分钟
        
        # 确定优先级 - 只处理P1和P2，P3/Low级别跳过
        # 注意：此系统中 'Medium' 实际上代表 P3，不是 P2
        if ticket.priority in ['P1', 'High']:
            priority = 'P1'
        elif ticket.priority in ['P2']:
            priority = 'P2'
        elif ticket.priority in ['P3', 'Medium', 'Low', '次要']:
            # P3/Low/Medium级别不处理，不显示通知
            continue
        else:
            # 其他未知级别，也跳过
            continue
        
        # 定义升级规则 - 每个节点对应的负责人（使用分钟）
        # P1: 8小时通知史乐慧，24小时通知fmz
        escalation_rules = {
            'P1': [
                {'minute': 8*60, 'person': '史乐慧'},   # 8小时
                {'minute': 24*60, 'person': 'fmz'},     # 24小时
                {'minute': 48*60, 'person': '总经理'},
                {'minute': 72*60, 'person': '总经理'}
            ],
            'P2': [
                {'minute': 24*60, 'person': '史乐慧'},  # 24小时
                {'minute': 48*60, 'person': 'fmz'},     # 48小时
                {'minute': 72*60, 'person': '总经理'}
            ]
        }
        
        rules = escalation_rules.get(priority, [])
        
        # 获取第一个升级节点时间（P1是1分钟，P2是24小时=1440分钟）
        first_rule_minute = rules[0]['minute'] if rules else 0
        
        # 判断是否在第一个升级节点之前
        is_before_first_rule = elapsed_minutes < first_rule_minute
        
        # 如果在第一个升级节点之前，且状态为已关闭/暂时规避/已解决，则不算超时
        if is_before_first_rule and ticket.status in ['Closed', '已关闭', '暂时规避', '已解决']:
            continue  # 未达到第一个升级节点且已关闭，不发送通知
        
        # 如果超过第一个升级节点，无论当前状态如何，都发送通知
        if elapsed_minutes < first_rule_minute:
            continue  # 未达到第一个升级节点，不发送通知
        
        # 只取当前达到的最高升级节点
        current_rule = None
        for rule in reversed(rules):  # 从后往前遍历，找到最高的节点
            if elapsed_minutes >= rule['minute'] and rule['person'] in allowed_users:
                current_rule = rule
                break
        
        # 如果找到当前负责人是指定用户的升级节点，生成通知
        if current_rule:
            rule_minute = current_rule['minute']
            responsible_person = current_rule['person']
            
            # 格式化超时时间
            if elapsed_minutes >= 24 * 60:
                elapsed_days = int(elapsed_minutes // (24 * 60))
                elapsed_text = f"{elapsed_days}天"
            elif elapsed_minutes >= 60:
                elapsed_hours = int(elapsed_minutes // 60)
                elapsed_text = f"{elapsed_hours}小时"
            else:
                elapsed_text = f"{int(elapsed_minutes)}分钟"
            
            # 获取工单标题，如果为空则显示默认文本
            ticket_title = ticket.title if ticket.title else "无标题"
            # 截断标题，超过8个字显示省略号
            if len(ticket_title) > 8:
                ticket_title = ticket_title[:8] + "..."
            
            title = f"[{priority}] 超时{elapsed_text} ID{ticket.id} | 标题：{ticket_title}"
            context = f"负责人：{responsible_person}"
            
            is_handled = False
            if user_id in ticket_handled_status and ticket.id in ticket_handled_status[user_id]:
                is_handled = ticket_handled_status[user_id][ticket.id].get('is_handled', False)
            
            notification_item = {
                "id": ticket.id,
                "avatar": "https://gw.alipayobjects.com/zos/rmsportal/GvqBnKhFgObvnSGkDsje.png",
                "title": title,
                "context": context,
                "form": "工单系统",
                "time": format_datetime(now, '%Y-%m-%d %H:%M'),
                "is_handled": is_handled
            }
            
            # 添加到通知列表
            notification_list.append(notification_item)
    
    # 返回通知列表（如果没有通知，返回空列表）
    return dict(code=200,
                data=[
                    {
                        "id": 1,
                        "title": "通知",
                        "children": notification_list[:10]  # 最多显示10条
                    }
                ])


# 菜单
@bp.get('/menu')
@login_required
def menu():
    # 定义需要 admin 权限才能查看的菜单标识和ID
    ADMIN_ONLY_MENU_CODES = ['system:log:main', 'system:admin_log:main']
    ADMIN_ONLY_MENU_IDS = [13, 68]  # 日志管理(ID:13) 和 操作日志(ID:68)
    
    if current_user.username != current_app.config.get("SUPERADMIN"):
        role = current_user.role
        powers = []
        parent_powers = []
        for i in role:
            # 如果角色没有被启用就直接跳过
            if i.enable == 0:
                continue
            # 遍历角色用户的所有权限，包括按钮
            for p in i.power:
                # 如果权限关闭了就直接跳过
                if p.enable == 0:
                    continue
                # 过滤掉只有 admin 才能查看的菜单（通过code或id匹配）
                if p.code in ADMIN_ONLY_MENU_CODES or p.id in ADMIN_ONLY_MENU_IDS:
                    continue
                # 添加所有权限到临时列表
                if p not in powers:
                    powers.append(p)

        # 收集所有权限对应的父菜单和目录，确保完整的菜单结构
        for p in powers:
            current_p = p
            while current_p.parent_id != 0:
                # 获取父级权限并确保其存在且启用
                parent = Power.query.filter_by(
                    id=current_p.parent_id,
                    enable=1
                ).first()
                if parent:
                    if parent not in powers and parent not in parent_powers:
                        parent_powers.append(parent)
                    # 继续查找父级的父级
                    current_p = parent
                else:
                    break

        # 将父级权限添加到权限列表
        powers.extend(parent_powers)

        # 过滤出一二级菜单
        powers = [p for p in powers if p.type in ['0', '1']]

        power_schema = PowerOutSchema(many=True)
        power_dict = power_schema.dump(powers)
        power_dict.sort(key=lambda x: (x['parent_id'], x['id']), reverse=True)

        menu_dict = OrderedDict()
        for _dict in power_dict:
            _dict_id = int(_dict['id']) # 明确转换为int
            if _dict_id in menu_dict:
                # 当前节点添加子节点
                _dict['children'] = copy.deepcopy(menu_dict[_dict_id])
                # 处理sort为None的情况，默认排序到最后
                _dict['children'].sort(key=lambda item: item['sort'] if item['sort'] is not None else 9999)
                # 删除子节点
                del menu_dict[_dict_id]

            _dict_parent_id = int(_dict['parent_id']) # 明确转换为int
            if _dict_parent_id not in menu_dict:
                menu_dict[_dict_parent_id] = [_dict]
            else:
                menu_dict[_dict_parent_id].append(_dict)
        # 处理sort为None的情况，默认排序到最后
        return jsonify(sorted(menu_dict.get(0) or [], key=lambda item: item['sort'] if item['sort'] is not None else 9999))
    else:
        powers = Power.query.filter(Power.enable == 1).all()
        power_schema = PowerOutSchema(many=True)
        power_dict = power_schema.dump(powers)
        power_dict.sort(key=lambda x: (x['parent_id'], x['id']), reverse=True)

        menu_dict = OrderedDict()
        for _dict in power_dict:
            _dict_id = int(_dict['id']) # 明确转换为int
            if _dict_id in menu_dict:
                # 当前节点添加子节点
                _dict['children'] = copy.deepcopy(menu_dict[_dict_id])
                # 处理sort为None的情况，默认排序到最后
                _dict['children'].sort(key=lambda item: item['sort'] if item['sort'] is not None else 9999)
                # 删除子节点
                del menu_dict[_dict_id]

            _dict_parent_id = int(_dict['parent_id']) # 明确转换为int
            if _dict_parent_id not in menu_dict:
                menu_dict[_dict_parent_id] = [_dict]
            else:
                menu_dict[_dict_parent_id].append(_dict)
        # 处理sort为None的情况，默认排序到最后
        return jsonify(sorted(menu_dict.get(0) or [], key=lambda item: item['sort'] if item['sort'] is not None else 9999))


# 控制台页面
@bp.get('/welcome')
@login_required
def welcome():
    """
    渲染系统欢迎页。
    """
    return render_template('system/analysis/main.html')


@bp.get('/')
@authorize("system:main:view")
def rights_main():
    """
    渲染系统主页，并获取当前用户的待办工单列表。
    待办工单定义为：状态不是"已解决"或"已关闭"，且负责人是当前用户的工单。
    """
    # 确保用户已登录
    if not current_user.is_authenticated:
        return redirect(url_for('passport.login'))

    # 获取当前用户的用户名，用于筛选待办工单
    current_username = current_user.username

    # 定义待处理的工单状态（基于数据库实际存在的状态值）
    PENDING_STATUSES = ['创建/提交', '处理中', '暂时规避', '未完成-售后原因', '未完成-客户原因', '未完成-研发原因']

    # 查询当前用户负责的待办工单（添加分页）
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    
    pending_tickets = Ticket.query.filter(
        Ticket.assignee_name == current_username, # 筛选负责人为当前用户的工单
        Ticket.status.in_(PENDING_STATUSES) # 筛选待处理状态的工单
    ).order_by(desc(Ticket.create_time)).paginate(page=page, per_page=limit, error_out=False) # 添加分页

    # 将工单对象转换为字典列表，以便在模板中访问
    tickets_data = []
    for ticket in pending_tickets.items:  # 使用 .items 获取分页后的数据
        tickets_data.append({
            'id': ticket.id,
            'title': ticket.title,
            'priority': ticket.priority,
            'status': ticket.status,
            'create_time': format_datetime(ticket.create_time)
        })

    return render_template('system/analysis/main.html', 
                     pending_tickets=tickets_data,
                     pagination=pending_tickets)  # 传递分页信息


@bp.get('/api/ticket_overview')
@login_required
def get_ticket_overview():
    """
    提供工单概览统计数据（待办、今日已解决、超时工单数量）。
    """
    # 确保用户已登录
    if not current_user.is_authenticated:
        return jsonify(success=False, msg="用户未登录"), 401

    current_username = current_user.username

    # 定义待处理的工单状态（基于数据库实际存在的状态值）
    PENDING_STATUSES = ['创建/提交', '处理中', '暂时规避', '未完成-售后原因', '未完成-客户原因', '未完成-研发原因']

    # 构建查询的基础
    base_query = Ticket.query

    # 如果不是超级管理员，则只查询当前用户负责的工单
    if current_username != current_app.config.get("SUPERADMIN"):
        base_query = base_query.filter(Ticket.assignee_name == current_username)

    # 获取待办工单数量
    pending_count = base_query.filter(
        Ticket.status.in_(PENDING_STATUSES)
    ).count()

    # 获取已解决工单数量 (今日)
    today = datetime.now().date()
    start_of_today = datetime.combine(today, datetime.min.time())
    end_of_today = datetime.combine(today, datetime.max.time())

    resolved_today_count = base_query.filter(
        Ticket.status == '已解决',
        Ticket.completion_time.between(start_of_today, end_of_today)
    ).count()

    # 获取超时工单数量 (未解决/未关闭且创建时间超过24小时)
    overdue_time_threshold = datetime.now() - timedelta(hours=24)
    overdue_count = base_query.filter(
        Ticket.create_time < overdue_time_threshold,
        Ticket.status.in_(PENDING_STATUSES)  # 仅计算待处理状态下的超时
    ).count()

    return jsonify(success=True, data={
        "pending_count": pending_count,
        "resolved_today_count": resolved_today_count,
        "overdue_count": overdue_count
    })


@bp.get('/api/pending_tickets_data')
@login_required
def get_pending_tickets_data():
    """
    提供 LayUI Table 使用的待办工单数据接口。
    """
    # 确保用户已登录
    if not current_user.is_authenticated:
        return jsonify(code=1, msg="用户未登录", count=0, data=[])

    current_username = current_user.username

    # 获取 LayUI Table 的分页参数
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    
    # 搜索关键字
    keyword = str_escape(request.args.get("searchKeyword", ""))
    
    # 定义待处理的工单状态（基于数据库实际存在的状态值）
    PENDING_STATUSES = ['创建/提交', '处理中', '暂时规避', '未完成-售后原因', '未完成-客户原因', '未完成-研发原因']

    # 构建查询
    query = Ticket.query.filter(
        Ticket.status.in_(PENDING_STATUSES)
    )
    
    # 如果不是超级管理员，则只查询当前用户负责的工单
    if current_username != current_app.config.get("SUPERADMIN"):
        query = query.filter(Ticket.assignee_name == current_username)
    
    # 应用关键字搜索
    if keyword:
        # 尝试将关键字转换为整数（工单ID）
        try:
            ticket_id = int(keyword)
            query = query.filter(Ticket.id == ticket_id)
        except ValueError:
            # 如果不是整数，则按标题搜索
            query = query.filter(Ticket.title.like(f"%{keyword}%"))

    # 计算总数
    count = query.count()

    # 应用排序和分页
    pending_tickets = query.order_by(desc(Ticket.create_time)).paginate(page=page, per_page=limit, error_out=False).items

    # 格式化数据
    tickets_data = []
    for ticket in pending_tickets:
        tickets_data.append({
            'id': ticket.id,
            'title': ticket.title,
            'priority': ticket.priority,
            'status': ticket.status,
            'create_time': format_datetime(ticket.create_time)
        })

    return jsonify(code=0, msg="查询成功", count=count, data=tickets_data)
