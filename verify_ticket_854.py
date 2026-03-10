from applications import create_app
from applications.models import Ticket
from applications.extensions import db

app = create_app()

with app.app_context():
    # 验证工单854的修复结果
    ticket = Ticket.query.filter_by(id=854).first()
    
    if ticket:
        print(f"工单ID: {ticket.id}")
        print(f"标题: {ticket.title}")
        print(f"状态: '{ticket.status}'")
        print(f"业务恢复时间: {ticket.business_recovery_time}")
        print(f"业务恢复截止时间: {ticket.business_recovery_deadline}")
        print(f"彻底修复截止时间: {ticket.complete_fix_deadline}")
        print(f"当前责任部门: {ticket.current_sla_dept}")
        print(f"是否超时: {ticket.is_overdue}")
        print(f"创建时间: {ticket.create_time}")
        print(f"更新时间: {ticket.update_time}")
    else:
        print("工单854不存在")
