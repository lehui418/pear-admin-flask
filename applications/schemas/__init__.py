from .admin_role import RoleOutSchema #, RoleInSchema
from .admin_power import PowerOutSchema, PowerOutSchema2
from .admin_dict import DictDataOutSchema, DictTypeOutSchema
from .admin_dept import DeptSchema
from .admin_log import OperationLogSchema
from .admin_photo import PhotoOutSchema
from .admin_mail import MailOutSchema
from .ticket import TicketSchema  # 新增导入 TicketSchema

__all__ = [
    'DeptSchema',
    'RoleOutSchema',
    # 'RoleInSchema',
    'PowerOutSchema',
    'PowerOutSchema2',
    'PhotoOutSchema',
    'DictDataOutSchema',
    'DictTypeOutSchema',
    'OperationLogSchema',
    'MailOutSchema',
    'TicketSchema'  # 将 TicketSchema 添加到 __all__
]
