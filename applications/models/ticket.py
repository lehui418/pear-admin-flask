from applications.extensions import db
from datetime import datetime

class Ticket(db.Model):
    __tablename__ = 'ticket'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    priority = db.Column(db.String(50), default='Medium')  # e.g., Low, Medium, High
    status = db.Column(db.String(50), default='Open')  # e.g., Open, In Progress, Resolved, Closed
    assignee_name = db.Column(db.String(100), nullable=True) # 负责人名称
    photo_ids = db.Column(db.Text, nullable=True)  # 存储图片ID列表，JSON格式
    image_references_str = db.Column(db.Text, nullable=True) # 存储图片引用的原始字符串 (Combined, for backward compatibility or general use)
    image_references_str_description = db.Column(db.Text, nullable=True) # For description field images
    image_references_str_relatedinfo = db.Column(db.Text, nullable=True) # For relatedinfo field images
    image_references_str_solution = db.Column(db.Text, nullable=True) # For solution field images
    user_id = db.Column(db.Integer, nullable=True)  # 添加 user_id 字段，用于兼容性
    customer_agent_name = db.Column(db.String(255), nullable=True)  # 客户/代理商名称
    
    # 新增字段开始
    impact_scope = db.Column(db.String(100), nullable=True)  # 影响范围
    relatedinfo = db.Column(db.Text, nullable=True)  # 处理记录（日志、截图等）
    solution = db.Column(db.Text, nullable=True)  # 处置方案
    security_level = db.Column(db.String(50), nullable=True) # 安全等级 (e.g., Low, Medium, High, Critical)
    threat_type = db.Column(db.String(100), nullable=True) # 威胁类型
    attack_source = db.Column(db.String(255), nullable=True) # 攻击来源
    attack_target = db.Column(db.String(255), nullable=True) # 攻击目标
    vulnerability_name = db.Column(db.String(255), nullable=True) # 漏洞名称
    cvss_score = db.Column(db.Float, nullable=True) # CVSS评分
    ioc_indicators = db.Column(db.Text, nullable=True) # IOC指标
    containment_measures = db.Column(db.Text, nullable=True) # 遏制措施
    eradication_measures = db.Column(db.Text, nullable=True) # 根除措施
    recovery_measures = db.Column(db.Text, nullable=True) # 恢复措施
    lessons_learned = db.Column(db.Text, nullable=True) # 经验教训
    compliance_requirements = db.Column(db.Text, nullable=True) # 合规要求 (JSON列表或逗号分隔)
    is_gdpr_compliant = db.Column(db.Boolean, default=False) # GDPR合规
    is_ccpa_compliant = db.Column(db.Boolean, default=False) # CCPA合规
    other_compliance = db.Column(db.String(255), nullable=True) # 其他合规说明
    # 新增字段结束

    # 服务方式相关字段
    service_method = db.Column(db.String(50), nullable=True)  # 服务方式：在线服务、电话支持、现场维修、返厂
    flow_type = db.Column(db.String(50), nullable=True)  # 流程类型：线上处理、上门处理
    flow_mode = db.Column(db.String(50), nullable=True)  # 流程模式：直接解决、暂时规避、转生产、转研发
    appointment_time = db.Column(db.DateTime, nullable=True)  # 预约时间
    engineer_id = db.Column(db.String(50), nullable=True)  # 工程师工号
    
    # 产品信息字段
    product_type_level1 = db.Column(db.String(50), nullable=True)  # 产品类型一级分类
    product_type_level2 = db.Column(db.String(50), nullable=True)  # 产品类型二级分类
    version_number = db.Column(db.String(50), nullable=True)  # 版本号
    serial_number = db.Column(db.String(50), nullable=True)  # 序列号
    
    # 保修和时间字段
    is_out_of_warranty = db.Column(db.Boolean, default=False)  # 是否过保
    order_time = db.Column(db.DateTime, nullable=True)  # 接单时间
    completion_time = db.Column(db.DateTime, nullable=True)  # 完成时间
    is_overdue = db.Column(db.Boolean, default=False, index=True) # 是否超时
    
    # SLA时间字段
    response_deadline = db.Column(db.DateTime, nullable=True)  # 响应截止时间
    diagnosis_start_time = db.Column(db.DateTime, nullable=True)  # 诊断开始时间
    diagnosis_deadline = db.Column(db.DateTime, nullable=True)  # 诊断截止时间
    business_recovery_time = db.Column(db.DateTime, nullable=True)  # 业务恢复时间
    business_recovery_deadline = db.Column(db.DateTime, nullable=True)  # 业务恢复截止时间
    complete_fix_deadline = db.Column(db.DateTime, nullable=True)  # 彻底修复截止时间
    current_sla_dept = db.Column(db.String(50), nullable=True)  # 当前SLA责任部门
    business_recovered = db.Column(db.Boolean, default=False, nullable=True)  # 业务是否已恢复
    
    # 问题分类字段
    problem_classification_main = db.Column(db.String(100), nullable=True)  # 问题主分类
    problem_classification_sub = db.Column(db.String(200), nullable=True)  # 问题子分类
    problem_classification_tags = db.Column(db.String(200), nullable=True)  # 问题自定义标签
    problem_tags = db.Column(db.String(200), nullable=True)  # 问题标签（逗号分隔）
    
    # 创建和更新时间
    create_time = db.Column(db.DateTime, default=datetime.now)
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationships (optional)
    # created_by = db.relationship('User', foreign_keys=[created_by_id], backref='created_tickets')
    # assigned_to = db.relationship('User', foreign_keys=[assigned_to_id], backref='assigned_tickets')

    def __repr__(self):
        return f'<Ticket {self.id}: {self.title}>'
        
    # 移除 __getattr__ 方法，因为它不能拦截 SQLAlchemy 的查询