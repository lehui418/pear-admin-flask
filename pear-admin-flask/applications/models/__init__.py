from .admin_dept import Dept
from .admin_dict import DictType, DictData
from .admin_log import OperationLog
from .admin_photo import Photo
from .admin_power import Power
from .admin_role import Role
from .admin_role_power import role_power
from .admin_user import User
from .admin_user_role import user_role # Changed from UserRole to user_role
from .ticket import Ticket  # 新增导入 Ticket 模型
from .ticket_flow import TicketFlow  # 新增导入 TicketFlow 模型
from .product_suggestion import ProductSuggestion  # 新增导入 ProductSuggestion 模型

__all__ = [
    'User',
    'Role',
    'Power',
    'Dept',
    'user_role',  # Changed from UserRole to user_role
    'role_power', # Changed from RolePower to role_power to be consistent
    'DictType',
    'DictData',
    'Photo',
    'OperationLog',
    'Mail',
    'Ticket',  # 将 Ticket 添加到 __all__
    'TicketFlow',  # 将 TicketFlow 添加到 __all__
    'ProductSuggestion'  # 将 ProductSuggestion 添加到 __all__
]
from .admin_mail import Mail
