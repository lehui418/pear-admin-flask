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
from sqlalchemy.exc import IntegrityError

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
        # 挂到“工单管理”菜单下面（Power.id=61）
        parent_id='61',
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
        
        # upsert 权限：避免重复运行时插入重复主键导致中断
        def upsert_power(expected: Power) -> Power:
            existing = Power.query.filter_by(id=expected.id).first()
            if existing:
                # 同步关键字段（尤其 enable/url/code 之类）
                existing.name = expected.name
                existing.type = expected.type
                existing.code = expected.code
                existing.url = expected.url
                existing.open_type = expected.open_type
                existing.parent_id = (
                    int(expected.parent_id) if expected.parent_id is not None else None
                )
                existing.icon = expected.icon
                existing.sort = expected.sort
                existing.enable = expected.enable
                return existing

            db.session.add(expected)
            # 立即 flush，若已存在则抛出 IntegrityError 以便我们兜底
            db.session.flush()
            return expected

        for power in customer_ticket_powers:
            try:
                upsert_power(power)
                print(f"权限已就绪: {power.name} (ID: {power.id})")
            except IntegrityError:
                # 理论上 upsert_power 已处理 existing，但仍兜底防止并发/脏数据
                db.session.rollback()
                existing = Power.query.filter_by(id=power.id).first()
                if not existing:
                    raise
                # 再次把字段同步一遍
                existing.name = power.name
                existing.type = power.type
                existing.code = power.code
                existing.url = power.url
                existing.open_type = power.open_type
                existing.parent_id = (
                    int(power.parent_id) if power.parent_id is not None else None
                )
                existing.icon = power.icon
                existing.sort = power.sort
                existing.enable = power.enable
                print(f"权限已存在且已同步: {power.name} (ID: {power.id})")

        db.session.commit()
        
        # 给管理员角色分配新权限
        admin_role = Role.query.filter_by(id=1).first()
        common_role = Role.query.filter_by(id=2).first()

        # 重新查询，确保关联使用的是“当前会话”里的对象实例
        powers_by_id = {p.id: Power.query.filter_by(id=p.id).first() for p in customer_ticket_powers}

        if admin_role:
            for pid in [73, 74, 75, 76]:
                power = powers_by_id.get(pid)
                if power and power not in admin_role.power:
                    admin_role.power.append(power)
                    print(f"给管理员角色分配权限: {power.name} (ID: {pid})")
        
        # 给普通用户角色分配查看和认领权限
        if common_role:
            # 注意：进入“客户工单管理页面”和数据接口都需要 system:customer_ticket:main（ID=73）
            for pid in [73, 74, 75]:
                power = powers_by_id.get(pid)
                if power and power not in common_role.power:
                    common_role.power.append(power)
                    print(f"给普通用户角色分配权限: {power.name} (ID: {pid})")
        
        db.session.commit()
        print("权限同步完成！")

if __name__ == '__main__':
    sync_permissions()
