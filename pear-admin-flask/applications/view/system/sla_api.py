#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from applications.services.sla_service import SLAService
from applications.extensions import db
from applications.models.ticket import Ticket
from applications.common.utils.http import success_api, fail_api
from applications.common.utils.rights import authorize
from datetime import datetime

bp = Blueprint('sla', __name__, url_prefix='/sla')


# 记录业务恢复时间
@bp.post('/record_business_recovery')
@authorize("system:ticket:edit")
def record_business_recovery():
    """记录业务恢复时间"""
    try:
        ticket_id = request.form.get('ticket_id')
        if not ticket_id:
            return fail_api(msg="缺少工单ID")
        
        ticket = db.session.get(Ticket, int(ticket_id))
        if not ticket:
            return fail_api(msg="工单不存在")
        
        # 记录业务恢复时间
        ticket.business_recovery_time = datetime.now()
        db.session.add(ticket)
        db.session.commit()
        
        current_app.logger.info(f"业务恢复时间已记录: 工单ID={ticket_id}, 记录人={current_user.username}")
        return success_api(msg="业务恢复时间记录成功")
        
    except Exception as e:
        current_app.logger.error(f"记录业务恢复时间失败: {str(e)}")
        return fail_api(msg="记录业务恢复时间失败")


# 记录彻底修复时间
@bp.post('/record_complete_fix')
@authorize("system:ticket:edit")
def record_complete_fix():
    """记录彻底修复时间"""
    try:
        ticket_id = request.form.get('ticket_id')
        if not ticket_id:
            return fail_api(msg="缺少工单ID")
        
        ticket = db.session.get(Ticket, int(ticket_id))
        if not ticket:
            return fail_api(msg="工单不存在")
        
        # 记录彻底修复时间
        ticket.completion_time = datetime.now()
        db.session.add(ticket)
        db.session.commit()
        
        current_app.logger.info(f"彻底修复时间已记录: 工单ID={ticket_id}, 记录人={current_user.username}")
        return success_api(msg="彻底修复时间记录成功")
        
    except Exception as e:
        current_app.logger.error(f"记录彻底修复时间失败: {str(e)}")
        return fail_api(msg="记录彻底修复时间失败")


# 获取工单SLA状态信息
@bp.get('/info/<int:ticket_id>')
@authorize("system:ticket:main")
def get_ticket_sla_info(ticket_id):
    """获取工单的SLA状态信息"""
    try:
        ticket = db.session.get(Ticket, int(ticket_id))
        if not ticket:
            return fail_api(msg="工单不存在")
        
        sla_info = SLAService.get_ticket_sla_info(ticket)
        return success_api(data=sla_info)
        
    except Exception as e:
        current_app.logger.error(f"获取工单SLA信息失败: {str(e)}")
        return fail_api(msg="获取工单SLA信息失败")


# 检查工单是否超时
@bp.get('/check_overdue/<int:ticket_id>')
@authorize("system:ticket:main")
def check_ticket_overdue(ticket_id):
    """检查工单是否超时"""
    try:
        ticket = db.session.get(Ticket, int(ticket_id))
        if not ticket:
            return fail_api(msg="工单不存在")
        
        is_overdue, overdue_info = SLAService.check_sla_timeout(ticket)
        return success_api(data={'is_overdue': is_overdue, 'overdue_info': overdue_info})
        
    except Exception as e:
        current_app.logger.error(f"检查工单超时状态失败: {str(e)}")
        return fail_api(msg="检查工单超时状态失败")


# 获取部门SLA统计信息
@bp.get('/department_statistics')
@authorize("system:ticket:main")
def get_department_sla_statistics():
    """获取部门SLA统计信息"""
    try:
        dept_name = request.args.get('department')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        statistics = SLAService.get_department_sla_stats(dept_name, start_date, end_date)
        return success_api(data=statistics)
        
    except Exception as e:
        current_app.logger.error(f"获取部门SLA统计失败: {str(e)}")
        return fail_api(msg="获取部门SLA统计失败")