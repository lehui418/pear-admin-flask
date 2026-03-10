from applications.extensions import db
from datetime import datetime

class TicketFlow(db.Model):
    """工单流程记录模型，用于跟踪工单状态变化和处理流程"""
    __tablename__ = 'ticket_flow'

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('ticket.id'), nullable=False)  # 关联工单ID
    flow_type = db.Column(db.String(50), nullable=False)  # 流程类型：线上处理、上门处理
    flow_mode = db.Column(db.String(50), nullable=False)  # 流程模式：直接解决、转生产、转研发等
    from_status = db.Column(db.String(50), nullable=True)  # 原状态
    to_status = db.Column(db.String(50), nullable=False)  # 新状态
    handler = db.Column(db.String(100), nullable=True)  # 处理人
    department = db.Column(db.String(100), nullable=True)  # 处理部门
    description = db.Column(db.Text, nullable=True)  # 流程描述
    notes = db.Column(db.Text, nullable=True)  # 备注信息
    is_temporary_solution = db.Column(db.Boolean, default=False)  # 是否为临时解决方案
    completion_time = db.Column(db.DateTime, nullable=True)  # 完成时间
    create_time = db.Column(db.DateTime, default=datetime.now)  # 创建时间
    
    # 问题分类字段（记录当时的问题分类）
    problem_classification_main = db.Column(db.String(100), nullable=True)  # 问题主分类
    problem_classification_sub = db.Column(db.String(200), nullable=True)  # 问题子分类
    
    # 超时相关字段
    is_overdue = db.Column(db.Boolean, default=False)  # 该流程步骤是否超时
    overdue_hours = db.Column(db.Float, default=0.0)  # 超时小时数
    sla_threshold = db.Column(db.Integer, default=24)  # SLA阈值（小时）
    
    # 关联关系
    ticket = db.relationship('Ticket', backref=db.backref('flows', lazy='dynamic', order_by='TicketFlow.create_time.asc()'))
    
    def __repr__(self):
        return f'<TicketFlow {self.id}: Ticket {self.ticket_id} - {self.from_status} -> {self.to_status}>'