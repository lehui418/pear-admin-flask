from marshmallow import Schema, fields
from applications.extensions import ma
from applications.models.ticket import Ticket

class TicketSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Ticket
        load_instance = True
        include_fk = True # Include foreign keys if needed

    id = fields.Integer(dump_only=True)
    title = fields.String(required=True)
    description = fields.String()
    priority = fields.String()
    status = fields.String()
    assignee_name = fields.String() # Added assignee_name field
    image_references_str = fields.String(allow_none=True) # Added image_references_str field
    image_references_str_description = fields.String(allow_none=True) # Added image_references_str_description field
    image_references_str_relatedinfo = fields.String(allow_none=True)  # 映射到模型的image_references_str_relatedinfo字段
    image_references_str_solution = fields.String(allow_none=True) # Added image_references_str_solution field
    photo_ids = fields.String(allow_none=True) # Added missing photo_ids field
    customer_agent_name = fields.String(allow_none=True) # 客户/代理商名称

    # 新增字段开始
    impact_scope = fields.String(allow_none=True)
    relatedinfo = fields.String(allow_none=True)  # 映射到模型的relatedinfo字段
    solution = fields.String(allow_none=True)
    security_level = fields.String(allow_none=True)
    threat_type = fields.String(allow_none=True)
    attack_source = fields.String(allow_none=True)
    attack_target = fields.String(allow_none=True)
    vulnerability_name = fields.String(allow_none=True)
    cvss_score = fields.Float(allow_none=True)
    ioc_indicators = fields.String(allow_none=True)
    containment_measures = fields.String(allow_none=True)
    eradication_measures = fields.String(allow_none=True)
    recovery_measures = fields.String(allow_none=True)
    lessons_learned = fields.String(allow_none=True)
    compliance_requirements = fields.String(allow_none=True)
    is_gdpr_compliant = fields.Boolean(allow_none=True)
    is_ccpa_compliant = fields.Boolean(allow_none=True)
    other_compliance = fields.String(allow_none=True)
    # 新增字段结束

    # created_by_id = fields.Integer()
    # assigned_to_id = fields.Integer()
    create_time = fields.DateTime(dump_only=True)
    update_time = fields.DateTime(dump_only=True)

    # Added fields from Ticket model
    service_method = fields.String(allow_none=True) # Ensure allow_none if nullable in model
    appointment_time = fields.DateTime(allow_none=True)
    engineer_id = fields.String(allow_none=True) # Ensure allow_none if nullable in model
    product_type_level1 = fields.String(allow_none=True) # Ensure allow_none if nullable in model
    product_type_level2 = fields.String(allow_none=True) # Ensure allow_none if nullable in model
    version_number = fields.String(allow_none=True) # Ensure allow_none if nullable in model
    serial_number = fields.String(allow_none=True) # Ensure allow_none if nullable in model
    is_out_of_warranty = fields.Boolean() # Default in model, so should be fine
    order_time = fields.DateTime(allow_none=True)
    completion_time = fields.DateTime(allow_none=True)
    problem_classification_main = fields.String(allow_none=True) # Ensure allow_none if nullable in model
    problem_classification_sub = fields.String(allow_none=True) # Ensure allow_none if nullable in model
    problem_classification_tags = fields.String(allow_none=True) # Ensure allow_none if nullable in model
    business_recovered = fields.Boolean(allow_none=True) # 业务是否已恢复

    # If you have relationships and want to nest them:
    # created_by = fields.Nested('UserSchema', only=('id', 'username')) # Example
    # assigned_to = fields.Nested('UserSchema', only=('id', 'username')) # Example