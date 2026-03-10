import os
import sys
import datetime

# 确保应用上下文存在
current_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(current_dir)
sys.path.append(project_dir)

# 导入应用和数据库
from app import app
from applications.extensions import db
from applications.models import Power, Role

# 创建应用上下文
with app.app_context():
    # 创建新的菜单权限
    now_time = datetime.datetime.now()
    new_powers = [
        Power(
            id=60,
            name='产品建议管理',
            type='1',
            code='system:product_suggestion:main',
            url='/system/product_suggestion/',
            open_type='_iframe',
            parent_id='1',
            icon='layui-icon layui-icon-edit',
            sort=8,
            create_time=now_time,
            enable=1,
        ),
        Power(
            id=61,
            name='工单管理',
            type='1',
            code='system:ticket:main',
            url='/system/ticket/',
            open_type='_iframe',
            parent_id='1',
            icon='layui-icon layui-icon-file',
            sort=9,
            create_time=now_time,
            enable=1,
        )
    ]

    # 批量添加新权限
    db.session.add_all(new_powers)

    try:
        db.session.commit()
        print('新权限添加成功')
    except Exception as e:
        print(f'添加新权限时出错: {e}')
        db.session.rollback()

    # 更新角色权限分配
    try:
        # 获取普通用户角色
        common_role = Role.query.filter_by(id=2).first()
        if common_role:
            # 为普通用户角色添加新权限
            new_power_60 = Power.query.filter_by(id=60).first()
            new_power_61 = Power.query.filter_by(id=61).first()
            
            if new_power_60 and new_power_60 not in common_role.power:
                common_role.power.append(new_power_60)
            
            if new_power_61 and new_power_61 not in common_role.power:
                common_role.power.append(new_power_61)
            
            db.session.commit()
            print('角色权限更新成功')
        else:
            print('未找到普通用户角色')
    except Exception as e:
        print(f'更新角色权限时出错: {e}')
        db.session.rollback()