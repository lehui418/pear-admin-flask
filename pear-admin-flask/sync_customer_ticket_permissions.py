"""
客户工单权限同步脚本
添加客户工单相关的权限和菜单
"""
import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from applications import create_app
from applications.extensions import db
from applications.models import Power, Role
from datetime import datetime

app = create_app()

now_time = datetime.now()

# 客户工单相关权限
customer_ticket_powers = [
    Power(
        id=73,
        name='客户工单',
        type='1',  # 菜单类型
        code='system:customer_ticket:main',
        url='/system/ticket/customer',
        open_type='_iframe',
        parent_id='1',  # 放在系统管理下
        icon='layui-icon layui-icon-username',
        sort=10,
        create_time=now_time,
        enable=1,
    ),
    Power(
        id=74,
        name='客户工单查看',
        type='2',  # 按钮类型
        code='system:customer_ticket:view',
        url='',
        open_type='',
        parent_id='73',
        icon='',
        sort=1,
        create_time=now_time,
        enable=1,
    ),
    Power(
        id=75,
        name='客户工单认领',
        type='2',  # 按钮类型
        code='system:customer_ticket:claim',
        url='',
        open_type='',
        parent_id='73',
        icon='',
        sort=2,
        create_time=now_time,
        enable=1,
    ),
    Power(
        id=76,
        name='客户工单编辑',
        type='2',  # 按钮类型
        code='system:customer_ticket:edit',
        url='',
        open_type='',
        parent_id='73',
        icon='',
        sort=3,
        create_time=now_time,
        enable=1,
    ),
]

def sync_permissions():
    """同步客户工单权限"""
    with app.app_context():
        print("开始同步客户工单权限...")
        
        # 检查权限是否已存在
        for power in customer_ticket_powers:
            existing = Power.query.filter_by(id=power.id).first()
            if existing:
                print(f"权限已存在: {power.name} (ID: {power.id})")
            else:
                db.session.add(power)
                print(f"添加权限: {power.name} (ID: {power.id})")
        
        db.session.commit()
        
        # 给管理员角色分配新权限
        admin_role = Role.query.filter_by(id=1).first()
        if admin_role:
            for power in customer_ticket_powers:
                if power not in admin_role.power:
                    admin_role.power.append(power)
                    print(f"给管理员角色分配权限: {power.name}")
        
        # 给普通用户角色分配查看和认领权限
        common_role = Role.query.filter_by(id=2).first()
        if common_role:
            view_power = Power.query.filter_by(id=74).first()
            claim_power = Power.query.filter_by(id=75).first()
            if view_power and view_power not in common_role.power:
                common_role.power.append(view_power)
                print(f"给普通用户角色分配权限: {view_power.name}")
            if claim_power and claim_power not in common_role.power:
                common_role.power.append(claim_power)
                print(f"给普通用户角色分配权限: {claim_power.name}")
        
        db.session.commit()
        print("权限同步完成！")

if __name__ == '__main__':
    sync_permissions()
