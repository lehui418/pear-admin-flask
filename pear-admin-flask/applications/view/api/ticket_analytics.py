from datetime import datetime, timedelta

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import and_, case, desc, func, or_

from applications.extensions import db
from applications.models import Ticket, TicketFlow

# 状态和优先级映射 (中文 -> 英文)
STATUS_MAP = {
    '待处理': 'Open',
    '处理中': 'In Progress',
    '已解决': 'Resolved',
    '已关闭': 'Closed',
    # 可以根据需要添加更多映射
}

PRIORITY_MAP = {
    '低': 'Low',
    '中': 'Medium',
    '高': 'High',
    '紧急': 'Urgent'
}

# --- 1. 定义状态和阈值 ---
COMPLETED_STATUSES = {'已关闭', '已处理', 'Resolved', 'Closed'}
BUSINESS_RECOVERY_STATUSES = {'已关闭', '已处理', '临时规避'}
COMPLETE_FIX_STATUSES = {'已关闭', '已处理'}

# 业务恢复时间配置
BUSINESS_RECOVERY_CONFIG = {
    'P1': {'hours': 8, 'days': 0},      # 8小时
    'P2': {'hours': 0, 'days': 2},      # 2个工作日
    'P3': {'hours': 0, 'days': 4},      # 4个工作日
    'P4': {'hours': 0, 'days': 0}       # 暂未定义
}

# 彻底修复时间配置
COMPLETE_FIX_CONFIG = {
    'P1': {'hours': 0, 'days': 5},      # 5个工作日
    'P2': {'hours': 0, 'days': 10},     # 10个工作日
    'P3': {'hours': 0, 'days': 20},     # 20个工作日
    'P4': {'hours': 0, 'days': 30}      # 30个工作日
}

# SLA超时阈值配置（小时）
OVERDUE_THRESHOLDS = {
    'P1': 8,          # 8小时
    'P2': 24,         # 24小时
    'P3': 48,         # 48小时
    'P4': 72,         # 72小时
    'Urgent': 4,      # 4小时
    'High': 8,        # 8小时
    'Medium': 24,     # 24小时
    'Low': 48         # 48小时
}

# 英文状态常量
STATUS_OPEN = 'Open'
STATUS_IN_PROGRESS = 'In Progress'
STATUS_RESOLVED = 'Resolved'
STATUS_CLOSED = 'Closed'

# 英文状态常量 (保留用于可能的其他地方，但分析逻辑主要使用中文)
STATUS_OPEN_EN = 'Open'
STATUS_IN_PROGRESS_EN = 'In Progress'
STATUS_RESOLVED_EN = 'Resolved'
STATUS_CLOSED_EN = 'Closed'

# 直接使用中文状态进行统计（基于数据库实际存在的状态值）
PENDING_STATUSES = ['创建/提交', '处理中', '暂时规避', '未完成-售后原因', '未完成-客户原因', '未完成-研发原因']
COMPLETED_STATUSES = ['已解决', '已关闭']

# STATUS_MAP 和 PRIORITY_MAP 保留，可能用于其他转换逻辑
# 定义用于统计的常量状态值 (如果其他地方确实需要英文转换后的值)
# STATUS_OPEN = STATUS_MAP['待处理']
# STATUS_IN_PROGRESS = STATUS_MAP['处理中']
# STATUS_RESOLVED = STATUS_MAP['已解决']
# STATUS_CLOSED = STATUS_MAP['已关闭']
# 已经在上面定义了 COMPLETED_STATUSES，这里不需要重复定义

def check_ticket_overdue_by_flow(ticket_id, priority, status):
    """
    检查工单是否超时（根据流程记录）- 与工单记录页面使用相同的逻辑
    """
    is_overdue = False
    overdue_hours = 0
    
    if not ticket_id:
        return is_overdue, overdue_hours
    
    try:
        flows = TicketFlow.query.filter_by(ticket_id=ticket_id).order_by(TicketFlow.create_time).all()
        if flows:
            # 检查是否有暂时规避状态
            has_temporary_solution = False
            for f in flows:
                if f.to_status == '暂时规避' or (f.flow_mode and '临时' in f.flow_mode):
                    has_temporary_solution = True
                    break
            
            # 根据优先级确定SLA阈值
            business_recovery_thresholds = {'P1': 8, 'P2': 24, 'P3': 48, 'P4': 72}
            complete_fix_thresholds = {'P1': 24, 'P2': 72, 'P3': 120, 'P4': 168}
            
            prev_flow_time = None
            has_temporary_solution_flag = False
            
            for flow in flows:
                # 判断阶段
                is_current_temporary = (
                    flow.to_status == '暂时规避' or 
                    (flow.flow_mode and '临时' in flow.flow_mode)
                )
                
                if has_temporary_solution_flag or is_current_temporary:
                    sla_threshold = complete_fix_thresholds.get(priority, 24)
                else:
                    sla_threshold = business_recovery_thresholds.get(priority, 24)
                
                # 计算时间
                if prev_flow_time and flow.create_time:
                    time_elapsed = (flow.create_time - prev_flow_time).total_seconds()
                    if time_elapsed > sla_threshold * 3600:
                        is_overdue = True
                        overdue_hours = round(time_elapsed / 3600, 1)
                        break
                
                prev_flow_time = flow.create_time
                if is_current_temporary:
                    has_temporary_solution_flag = True
            
            # 检查最后一个节点到当前时间是否超时（如果工单未关闭）
            if not is_overdue and prev_flow_time and status not in ['已关闭', '已解决']:
                now = datetime.now()
                if has_temporary_solution_flag:
                    sla_threshold = complete_fix_thresholds.get(priority, 24)
                else:
                    sla_threshold = business_recovery_thresholds.get(priority, 24)
                
                time_elapsed = (now - prev_flow_time).total_seconds()
                if time_elapsed > sla_threshold * 3600:
                    is_overdue = True
                    overdue_hours = round(time_elapsed / 3600, 1)
    except Exception as e:
        current_app.logger.error(f"Error checking overdue status for ticket {ticket_id}: {e}")
    
    return is_overdue, overdue_hours

def get_ticket_analytics_data(date_range=None, status_filter=None, classification_filter=None, priority_filter=None, search=None, engineer_period=None, status_period=None, issue_period=None, priority_chart_period=None):
    """
    获取工单分析数据的核心函数 (修正最终版)
    """
    try:
        # 添加日志：记录接收到的参数
        current_app.logger.info(f"接收到的参数 - date_range: {date_range}, status_filter: {status_filter}, classification_filter: {classification_filter}, priority_filter: {priority_filter}, search: {search}, engineer_period: {engineer_period}, status_period: {status_period}, issue_period: {issue_period}, priority_chart_period: {priority_chart_period}")

        # --- 1. 构建当前周期的查询 ---
        query = Ticket.query
        start_date_obj, end_date_obj = None, None
        if date_range:
            try:
                # 首先尝试解析所有日期范围为 "YYYY-MM-DD - YYYY-MM-DD" 格式
                if ' - ' in date_range:
                    parts = date_range.split(' - ')
                    if len(parts) == 2:
                        start_date_obj = datetime.strptime(parts[0], '%Y-%m-%d')
                        end_date_obj = datetime.strptime(parts[1], '%Y-%m-%d')
                        end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59, microsecond=999999)
                        current_app.logger.info(f"应用标准日期范围过滤: {start_date_obj} 到 {end_date_obj}")
                    else:
                        start_date_obj = None
                        end_date_obj = None
                # 如果不是 "YYYY-MM-DD - YYYY-MM-DD" 格式，再尝试预定义的日期范围
                else:
                    today = datetime.now().date()
                    if date_range == 'today':
                        start_date_obj = datetime.combine(today, datetime.min.time())
                        end_date_obj = datetime.combine(today, datetime.max.time())
                        current_app.logger.info(f"转换今日时间范围: {start_date_obj} 到 {end_date_obj}")
                    elif date_range == 'this_week':
                        # 本周一作为开始日期
                        start_of_week = today - timedelta(days=today.weekday())
                        start_date_obj = datetime.combine(start_of_week, datetime.min.time())
                        # 本周日作为结束日期
                        end_of_week = start_of_week + timedelta(days=6)
                        end_date_obj = datetime.combine(end_of_week, datetime.max.time())
                        current_app.logger.info(f"转换本周时间范围: {start_date_obj} 到 {end_date_obj}")
                    elif date_range == 'this_month':
                        # 本月第一天
                        start_of_month = today.replace(day=1)
                        start_date_obj = datetime.combine(start_of_month, datetime.min.time())
                        # 本月最后一天
                        next_month = start_of_month.replace(day=28) + timedelta(days=4)
                        end_of_month = next_month - timedelta(days=next_month.day)
                        end_date_obj = datetime.combine(end_of_month, datetime.max.time())
                        current_app.logger.info(f"转换本月时间范围: {start_date_obj} 到 {end_date_obj}")
                    elif date_range == 'this_quarter':
                        # 当前季度第一个月
                        current_quarter = (today.month - 1) // 3
                        first_month_of_quarter = current_quarter * 3 + 1
                        start_of_quarter = today.replace(month=first_month_of_quarter, day=1)
                        start_date_obj = datetime.combine(start_of_quarter, datetime.min.time())
                        # 当前季度最后一个月的最后一天
                        last_month_of_quarter = first_month_of_quarter + 2
                        if last_month_of_quarter > 12:
                            last_month_of_quarter = 12
                        next_month = start_of_quarter.replace(month=last_month_of_quarter, day=28) + timedelta(days=4)
                        end_of_quarter = next_month - timedelta(days=next_month.day)
                        end_date_obj = datetime.combine(end_of_quarter, datetime.max.time())
                        current_app.logger.info(f"转换本季度时间范围: {start_date_obj} 到 {end_date_obj}")
                    elif date_range == 'last_7_days':
                        # 最近7天
                        start_date_obj = datetime.combine(today - timedelta(days=7), datetime.min.time())
                        end_date_obj = datetime.combine(today, datetime.max.time())
                        current_app.logger.info(f"转换最近7天时间范围: {start_date_obj} 到 {end_date_obj}")
                    elif date_range == 'last_30_days':
                        # 最近30天
                        start_date_obj = datetime.combine(today - timedelta(days=30), datetime.min.time())
                        end_date_obj = datetime.combine(today, datetime.max.time())
                        current_app.logger.info(f"转换最近30天时间范围: {start_date_obj} 到 {end_date_obj}")
                    elif date_range == 'last_90_days':
                        # 最近90天
                        start_date_obj = datetime.combine(today - timedelta(days=90), datetime.min.time())
                        end_date_obj = datetime.combine(today, datetime.max.time())
                        current_app.logger.info(f"转换最近90天时间范围: {start_date_obj} 到 {end_date_obj}")
                    elif date_range == 'last_180_days':
                        # 最近180天
                        start_date_obj = datetime.combine(today - timedelta(days=180), datetime.min.time())
                        end_date_obj = datetime.combine(today, datetime.max.time())
                        current_app.logger.info(f"转换最近180天时间范围: {start_date_obj} 到 {end_date_obj}")
                    else:
                        start_date_obj = None
                        end_date_obj = None
                
                if start_date_obj and end_date_obj:
                    query = query.filter(Ticket.create_time.between(start_date_obj, end_date_obj))
                    current_app.logger.info(f"成功应用日期范围过滤: {start_date_obj} 到 {end_date_obj}")
            except (ValueError, IndexError) as e:
                current_app.logger.warning(f"日期范围格式不正确: '{date_range}'，错误: {str(e)}，将查询所有时间的工单。")
        else:
            current_app.logger.info("未提供日期范围，将查询所有时间的工单。")

        if status_filter:
            query = query.filter(Ticket.status == status_filter)
        if classification_filter:
            query = query.filter(Ticket.problem_classification_main == classification_filter)
        if priority_filter:
            query = query.filter(Ticket.priority == priority_filter)
        if search:
            search_term = f'%{search}%'
            query = query.filter(or_(Ticket.title.ilike(search_term), Ticket.description.ilike(search_term), Ticket.assignee_name.ilike(search_term)))

        all_tickets_in_range = query.all()

        # --- 2. 构建上一个周期的查询 ---
        previous_week_query = Ticket.query
        if start_date_obj and end_date_obj:
            duration = end_date_obj - start_date_obj
            prev_start_date = start_date_obj - duration
            prev_end_date = start_date_obj
            previous_week_query = previous_week_query.filter(Ticket.create_time.between(prev_start_date, prev_end_date))
        else:
            # 如果没有时间范围，则上周数据为0
            previous_week_query = previous_week_query.filter(Ticket.id == -1) # 返回空结果

        if status_filter:
            previous_week_query = previous_week_query.filter(Ticket.status == status_filter)
        if classification_filter:
            previous_week_query = previous_week_query.filter(Ticket.problem_classification_main == classification_filter)
        if priority_filter:
            previous_week_query = previous_week_query.filter(Ticket.priority == priority_filter)
        if search:
             previous_week_query = previous_week_query.filter(or_(Ticket.title.ilike(search_term), Ticket.description.ilike(search_term), Ticket.assignee_name.ilike(search_term)))
        
        previous_week_tickets = previous_week_query.all()

        # --- 3. 计算KPI ---
        # 当前周期
        total_tickets = len(all_tickets_in_range)
        
        # 修正：确保COMPLETED_STATUSES包含所有可能的完成状态
        completed_statuses = {'已解决', '已关闭', 'Resolved', 'Closed'}
        completed_tickets_list = [t for t in all_tickets_in_range if t.status in completed_statuses]
        completed_tickets = len(completed_tickets_list)
        pending_tickets = total_tickets - completed_tickets
        
        # 计算超时工单数量（使用流程记录检查，与工单记录页面保持一致）
        all_tickets_list = all_tickets_in_range
        overdue_tickets = 0
        overdue_tickets_list = []
        
        for ticket in all_tickets_list:
            priority = ticket.priority or 'P4'
            is_overdue, overdue_hours = check_ticket_overdue_by_flow(ticket.id, priority, ticket.status)
            if is_overdue:
                overdue_tickets += 1
                overdue_tickets_list.append({
                    'ticket': ticket,
                    'overdue_hours': overdue_hours
                })
        
        # 修正：确保 avg_resolution_hours 的计算逻辑正确无误
        total_resolution_seconds = 0
        
        for t in completed_tickets_list:
            if t.completion_time and t.create_time:
                total_resolution_seconds += (t.completion_time - t.create_time).total_seconds()

        avg_resolution_hours = (total_resolution_seconds / completed_tickets / 3600) if completed_tickets > 0 else 0

        # 上个周期
        previous_week_total = len(previous_week_tickets)
        previous_week_completed_list = [t for t in previous_week_tickets if t.status in COMPLETED_STATUSES]
        previous_week_completed = len(previous_week_completed_list)
        
        # 上周期超时工单数（使用流程记录检查）
        previous_week_overdue = 0
        for t in previous_week_tickets:
            priority = t.priority or 'P4'
            is_overdue, _ = check_ticket_overdue_by_flow(t.id, priority, t.status)
            if is_overdue:
                previous_week_overdue += 1
        previous_week_total_resolution_seconds = sum([(t.completion_time - t.create_time).total_seconds() for t in previous_week_completed_list if t.completion_time and t.create_time])
        previous_week_avg_resolution_hours = (previous_week_total_resolution_seconds / previous_week_completed / 3600) if previous_week_completed > 0 else 0


        # --- 4. 计算图表数据 (基于当前周期或status_period参数) ---
        # 根据 status_period 参数确定趋势图表的时间范围
        today = datetime.now().date()
        if status_period == 'this_week':
            # 本周
            start_of_week = today - timedelta(days=today.weekday())
            trend_start = datetime.combine(start_of_week, datetime.min.time())
            trend_end = datetime.combine(today, datetime.max.time())
        elif status_period == 'last_week':
            # 上周
            start_of_this_week = today - timedelta(days=today.weekday())
            start_of_last_week = start_of_this_week - timedelta(days=7)
            end_of_last_week = start_of_this_week - timedelta(days=1)
            trend_start = datetime.combine(start_of_last_week, datetime.min.time())
            trend_end = datetime.combine(end_of_last_week, datetime.max.time())
        elif status_period == 'all':
            # 全部数据 - 查询最早的工单日期
            earliest_ticket = Ticket.query.order_by(Ticket.create_time.asc()).first()
            if earliest_ticket and earliest_ticket.create_time:
                trend_start = earliest_ticket.create_time
            else:
                trend_start = datetime.combine(today - timedelta(days=365), datetime.min.time())
            trend_end = datetime.combine(today, datetime.max.time())
        else:
            # 使用当前周期
            trend_start = start_date_obj
            trend_end = end_date_obj
        
        trend_categories = []
        trend_data = []
        if trend_start and trend_end:
            days_in_range = (trend_end - trend_start).days + 1
            trend_points = { (trend_start.date() + timedelta(days=i)).strftime('%Y-%m-%d'): 0 for i in range(days_in_range) }
        else:
             # 默认显示最近90天的数据，以确保能显示超时工单
             trend_points = { (datetime.now().date() - timedelta(days=i)).strftime('%Y-%m-%d'): 0 for i in range(90) }

        # 查询趋势图表的工单数据
        trend_query = Ticket.query
        if trend_start and trend_end:
            trend_query = trend_query.filter(Ticket.create_time.between(trend_start, trend_end))
        if status_filter:
            trend_query = trend_query.filter(Ticket.status == status_filter)
        if classification_filter:
            trend_query = trend_query.filter(Ticket.problem_classification_main == classification_filter)
        if priority_filter:
            trend_query = trend_query.filter(Ticket.priority == priority_filter)
        if search:
            search_term = f'%{search}%'
            trend_query = trend_query.filter(or_(Ticket.title.ilike(search_term), Ticket.description.ilike(search_term), Ticket.assignee_name.ilike(search_term)))
        
        trend_tickets = trend_query.all()
        
        for ticket in trend_tickets:
            if ticket.create_time:
                date_str = ticket.create_time.strftime('%Y-%m-%d')
                if date_str in trend_points:
                    trend_points[date_str] += 1
        
        sorted_dates = sorted(trend_points.keys())
        for date_str in sorted_dates:
            trend_categories.append(datetime.strptime(date_str, '%Y-%m-%d').strftime('%m/%d'))
            trend_data.append(trend_points[date_str])

        # 根据 issue_period 参数确定工单分类统计的时间范围
        if issue_period == 'this_week':
            # 本周
            start_of_week = today - timedelta(days=today.weekday())
            issue_start = datetime.combine(start_of_week, datetime.min.time())
            issue_end = datetime.combine(today, datetime.max.time())
        elif issue_period == 'last_week':
            # 上周
            start_of_this_week = today - timedelta(days=today.weekday())
            start_of_last_week = start_of_this_week - timedelta(days=7)
            end_of_last_week = start_of_this_week - timedelta(days=1)
            issue_start = datetime.combine(start_of_last_week, datetime.min.time())
            issue_end = datetime.combine(end_of_last_week, datetime.max.time())
        elif issue_period == 'all':
            # 全部数据 - 查询最早的工单日期
            earliest_ticket = Ticket.query.order_by(Ticket.create_time.asc()).first()
            if earliest_ticket and earliest_ticket.create_time:
                issue_start = earliest_ticket.create_time
            else:
                issue_start = datetime.combine(today - timedelta(days=365), datetime.min.time())
            issue_end = datetime.combine(today, datetime.max.time())
        else:
            # 使用当前周期
            issue_start = start_date_obj
            issue_end = end_date_obj
        
        # 查询工单分类统计数据
        issue_query = Ticket.query
        if issue_start and issue_end:
            issue_query = issue_query.filter(Ticket.create_time.between(issue_start, issue_end))
        if status_filter:
            issue_query = issue_query.filter(Ticket.status == status_filter)
        if classification_filter:
            issue_query = issue_query.filter(Ticket.problem_classification_main == classification_filter)
        if priority_filter:
            issue_query = issue_query.filter(Ticket.priority == priority_filter)
        if search:
            search_term = f'%{search}%'
            issue_query = issue_query.filter(or_(Ticket.title.ilike(search_term), Ticket.description.ilike(search_term), Ticket.assignee_name.ilike(search_term)))
        
        issue_tickets = issue_query.all()
        
        classification_stats = {}
        for ticket in issue_tickets:
            cat = ticket.problem_classification_main or '未分类'
            classification_stats[cat] = classification_stats.get(cat, 0) + 1
        classification_labels = list(classification_stats.keys())
        classification_data = list(classification_stats.values())
        
        # 添加日志：输出分类统计结果
        current_app.logger.info(f"分类统计结果 (当前周期): 总工单数={len(issue_tickets)}, 分类数={len(classification_stats)}")
        for cat, count in sorted(classification_stats.items(), key=lambda x: x[1], reverse=True)[:5]:
            current_app.logger.info(f"  - {cat}: {count}个工单")
        
        # 根据 priority_chart_period 参数确定优先级图表的时间范围
        if priority_chart_period == 'this_week':
            # 本周
            start_of_week = today - timedelta(days=today.weekday())
            priority_start = datetime.combine(start_of_week, datetime.min.time())
            priority_end = datetime.combine(today, datetime.max.time())
        elif priority_chart_period == 'last_week':
            # 上周
            start_of_this_week = today - timedelta(days=today.weekday())
            start_of_last_week = start_of_this_week - timedelta(days=7)
            end_of_last_week = start_of_this_week - timedelta(days=1)
            priority_start = datetime.combine(start_of_last_week, datetime.min.time())
            priority_end = datetime.combine(end_of_last_week, datetime.max.time())
        elif priority_chart_period == 'all':
            # 全部数据 - 查询最早的工单日期
            earliest_ticket = Ticket.query.order_by(Ticket.create_time.asc()).first()
            if earliest_ticket and earliest_ticket.create_time:
                priority_start = earliest_ticket.create_time
            else:
                priority_start = datetime.combine(today - timedelta(days=365), datetime.min.time())
            priority_end = datetime.combine(today, datetime.max.time())
        else:
            # 使用当前周期
            priority_start = start_date_obj
            priority_end = end_date_obj
        
        # 查询优先级统计数据
        priority_query = Ticket.query
        if priority_start and priority_end:
            priority_query = priority_query.filter(Ticket.create_time.between(priority_start, priority_end))
        if status_filter:
            priority_query = priority_query.filter(Ticket.status == status_filter)
        if classification_filter:
            priority_query = priority_query.filter(Ticket.problem_classification_main == classification_filter)
        if priority_filter:
            priority_query = priority_query.filter(Ticket.priority == priority_filter)
        if search:
            search_term = f'%{search}%'
            priority_query = priority_query.filter(or_(Ticket.title.ilike(search_term), Ticket.description.ilike(search_term), Ticket.assignee_name.ilike(search_term)))
        
        priority_tickets = priority_query.all()
        
        # 统计各优先级的工单数量
        # 将旧版本的优先级映射到新版本：High->P1, Medium->P3, Low->P4
        # 其他未知优先级也映射到P4
        priority_mapping = {
            'High': 'P1',
            'Medium': 'P3', 
            'Low': 'P4'
        }
        priority_stats = {'P1': 0, 'P2': 0, 'P3': 0, 'P4': 0}
        for ticket in priority_tickets:
            p = ticket.priority
            if not p:
                p = 'P4'  # 默认P4
            # 映射旧优先级到新的
            if p in priority_mapping:
                p = priority_mapping[p]
            # 如果不是P1-P4，则归为P4
            if p not in priority_stats:
                p = 'P4'
            priority_stats[p] += 1
        
        priority_labels = ['P1', 'P2', 'P3', 'P4']
        priority_data = [priority_stats[p] for p in priority_labels]
        
        # 根据 engineer_period 参数计算工程师统计数据
        # 如果指定了 engineer_period，则使用该周期；否则使用当前周期
        today = datetime.now().date()
        
        if engineer_period == 'this_week':
            # 本周
            start_of_week = today - timedelta(days=today.weekday())
            engineer_start = datetime.combine(start_of_week, datetime.min.time())
            engineer_end = datetime.combine(today, datetime.max.time())
        elif engineer_period == 'last_week':
            # 上周
            start_of_this_week = today - timedelta(days=today.weekday())
            start_of_last_week = start_of_this_week - timedelta(days=7)
            end_of_last_week = start_of_this_week - timedelta(days=1)
            engineer_start = datetime.combine(start_of_last_week, datetime.min.time())
            engineer_end = datetime.combine(end_of_last_week, datetime.max.time())
        elif engineer_period == 'all':
            # 全部数据，不限制时间范围
            engineer_start = None
            engineer_end = None
        else:
            # 使用当前周期
            engineer_start = start_date_obj
            engineer_end = end_date_obj
        
        # 查询工程师统计数据
        engineer_query = Ticket.query
        if engineer_start and engineer_end:
            engineer_query = engineer_query.filter(Ticket.create_time.between(engineer_start, engineer_end))
        if status_filter:
            engineer_query = engineer_query.filter(Ticket.status == status_filter)
        if classification_filter:
            engineer_query = engineer_query.filter(Ticket.problem_classification_main == classification_filter)
        if priority_filter:
            engineer_query = engineer_query.filter(Ticket.priority == priority_filter)
        if search:
            search_term = f'%{search}%'
            engineer_query = engineer_query.filter(or_(Ticket.title.ilike(search_term), Ticket.description.ilike(search_term), Ticket.assignee_name.ilike(search_term)))
        
        engineer_tickets = engineer_query.all()
        
        assignee_stats_map = {}
        for ticket in engineer_tickets:
            assignee = ticket.assignee_name or '未分配'
            assignee_stats_map[assignee] = assignee_stats_map.get(assignee, 0) + 1
        assignee_names = list(assignee_stats_map.keys())
        assignee_counts = list(assignee_stats_map.values())

        assignee_details = {}
        for ticket in engineer_tickets:
            name = ticket.assignee_name
            if not name: continue
            if name not in assignee_details:
                assignee_details[name] = {'total_tickets': 0, 'completed_tickets': 0, 'total_resolution_seconds': 0}
            assignee_details[name]['total_tickets'] += 1
            if ticket.status in COMPLETED_STATUSES:
                assignee_details[name]['completed_tickets'] += 1
                if ticket.completion_time and ticket.create_time:
                    assignee_details[name]['total_resolution_seconds'] += (ticket.completion_time - ticket.create_time).total_seconds()

        assignee_data_for_table = []
        for name, details in assignee_details.items():
            completion_rate = (details['completed_tickets'] / details['total_tickets'] * 100) if details['total_tickets'] > 0 else 0
            avg_seconds = (details['total_resolution_seconds'] / details['completed_tickets']) if details['completed_tickets'] > 0 else 0
            days, rem = divmod(avg_seconds, 86400)
            hours, rem = divmod(rem, 3600)
            mins, _ = divmod(rem, 60)
            avg_res_str = f"{int(days)}天{int(hours)}小时" if days > 0 else f"{int(hours)}小时{int(mins)}分" if avg_seconds > 0 else "N/A"
            assignee_data_for_table.append({'name': name, 'total_tickets': details['total_tickets'], 'completed_tickets': details['completed_tickets'], 'completion_rate': round(completion_rate, 2), 'avg_resolution_time': avg_res_str, 'satisfaction_score': 0})
        
        # 计算上周的工程师统计数据（用于对比）
        start_of_this_week = today - timedelta(days=today.weekday())
        start_of_last_week = start_of_this_week - timedelta(days=7)
        end_of_last_week = start_of_this_week - timedelta(days=1)
        last_week_start = datetime.combine(start_of_last_week, datetime.min.time())
        last_week_end = datetime.combine(end_of_last_week, datetime.max.time())
        
        last_week_engineer_query = Ticket.query.filter(Ticket.create_time.between(last_week_start, last_week_end))
        if status_filter:
            last_week_engineer_query = last_week_engineer_query.filter(Ticket.status == status_filter)
        if classification_filter:
            last_week_engineer_query = last_week_engineer_query.filter(Ticket.problem_classification_main == classification_filter)
        if priority_filter:
            last_week_engineer_query = last_week_engineer_query.filter(Ticket.priority == priority_filter)
        if search:
            last_week_engineer_query = last_week_engineer_query.filter(or_(Ticket.title.ilike(search_term), Ticket.description.ilike(search_term), Ticket.assignee_name.ilike(search_term)))
        
        last_week_engineer_tickets = last_week_engineer_query.all()
        
        previous_week_assignee_stats_map = {}
        for ticket in last_week_engineer_tickets:
            assignee = ticket.assignee_name or '未分配'
            previous_week_assignee_stats_map[assignee] = previous_week_assignee_stats_map.get(assignee, 0) + 1
        previous_week_assignee_names = list(previous_week_assignee_stats_map.keys())
        previous_week_assignee_counts = list(previous_week_assignee_stats_map.values())
        
        # --- 4.5. 计算阶段耗时分析图表数据 ---
        # 注意：这是一个简化的实现。真实的阶段耗时分析需要一个单独的表来记录每个工单的状态变更历史和时间戳。
        # 这里我们模拟一些数据用于前端展示。
        time_analysis_data = {
            'categories': ['响应阶段', '分配阶段', '处理阶段', '解决阶段'],
            'data': [
                # 随机生成一些示例数据 (单位：小时)
                round(avg_resolution_hours * 0.1, 1) if avg_resolution_hours > 0 else 1.5,
                round(avg_resolution_hours * 0.2, 1) if avg_resolution_hours > 0 else 3.2,
                round(avg_resolution_hours * 0.6, 1) if avg_resolution_hours > 0 else 8.1,
                round(avg_resolution_hours * 0.1, 1) if avg_resolution_hours > 0 else 2.4,
            ]
        }

        # --- 5. 组装返回数据 ---
        response_data = {
            "statistics": {
                "total": total_tickets, 
                "pending": pending_tickets, 
                "completed": completed_tickets, 
                "overdue": overdue_tickets,
                "avg_resolution_time": round(avg_resolution_hours, 1)
            },
            "previous_week": {
                "total": previous_week_total,
                "completed": previous_week_completed,
                "overdue": previous_week_overdue,
                "avg_resolution_time": round(previous_week_avg_resolution_hours, 1),
                "assignee_stats": {'labels': previous_week_assignee_names, 'data': previous_week_assignee_counts}
            },
            "trendChart": {"categories": trend_categories, "data": trend_data},
            "categoryChart": {"labels": classification_labels, "data": classification_data},
            "priorityChart": {"labels": priority_labels, "data": priority_data},
            'assignee_stats': {'labels': assignee_names, 'data': assignee_counts},
            'assignee_data': assignee_data_for_table,
            "timeAnalysisChart": time_analysis_data,  # <-- 添加新的图表数据
            "upcoming_overdue_details": []
        }
        
        # 获取超时工单详情（使用流程记录检查）
        overdue_tickets_details = []
        for item in overdue_tickets_list:
            ticket = item['ticket']
            overdue_hours = item['overdue_hours']
            
            if ticket.id and db.session.query(Ticket.id).filter(Ticket.id == ticket.id).first():
                overdue_tickets_details.append({
                    'id': ticket.id,
                    'ticket_number': f'TK{ticket.id:08d}',
                    'title': ticket.title if ticket.title else '无标题工单',
                    'priority': ticket.priority,
                    'status': ticket.status,
                    'responsible_department': ticket.current_sla_dept or '技术支持部',
                    'department': ticket.current_sla_dept or '技术支持部',
                    'create_time': ticket.create_time.strftime('%Y-%m-%d %H:%M') if ticket.create_time else '',
                    'completion_time': ticket.completion_time.strftime('%Y-%m-%d %H:%M') if ticket.completion_time else '',
                    'overdue_hours': overdue_hours
                })
        
        # 根据超时时间降序排序（超时越久排越前）
        overdue_tickets_details = sorted(overdue_tickets_details, key=lambda x: x['overdue_hours'], reverse=True)
        
        # 计算部门超时统计
        department_stats = {}
        for ticket in overdue_tickets_details:
            dept = ticket['responsible_department']
            if dept not in department_stats:
                department_stats[dept] = {
                    'count': 0,
                    'total_overdue_hours': 0
                }
            
            department_stats[dept]['count'] += 1
            department_stats[dept]['total_overdue_hours'] += ticket['overdue_hours']
        
        # 转换为前端期望的数组格式
        department_stats_list = []
        for dept_name, stats in department_stats.items():
            avg_overdue_hours = round(stats['total_overdue_hours'] / stats['count'], 1) if stats['count'] > 0 else 0
            department_stats_list.append({
                'department': dept_name,
                'overdue_count': stats['count'],
                'avg_overdue_hours': avg_overdue_hours
            })
        
        response_data["overdue_tickets_details"] = overdue_tickets_details
        response_data["department_overdue_stats"] = department_stats_list
        
        return response_data, None

    except Exception as e:
        current_app.logger.error(f"获取工单分析数据出错: {str(e)}", exc_info=True)
        return None, str(e)