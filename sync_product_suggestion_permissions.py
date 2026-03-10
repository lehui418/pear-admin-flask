#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
同步产品建议权限到数据库
"""

from applications import create_app
from applications.extensions import db
from applications.models import Power, Role

app = create_app()

with app.app_context():
    print('=== 开始同步产品建议权限 ===')
    
    # 检查权限是否已存在
    existing_permissions = Power.query.filter(Power.id.in_([70, 71, 72])).all()
    existing_ids = [p.id for p in existing_permissions]
    print(f'\n已存在的权限ID: {existing_ids}')
    
    # 添加新增权限
    new_permissions = []
    
    if 70 not in existing_ids:
        from datetime import datetime
        now_time = datetime.now()
        new_permissions.append(Power(
            id=70,
            name='产品建议新增',
            type='2',
            code='system:product_suggestion:add',
            url='',
            open_type='',
            parent_id='60',
            icon='',
            sort=1,
            create_time=now_time,
            enable=1,
        ))
        print('添加权限: 产品建议新增 (ID: 70)')
    
    if 71 not in existing_ids:
        from datetime import datetime
        now_time = datetime.now()
        new_permissions.append(Power(
            id=71,
            name='产品建议编辑',
            type='2',
            code='system:product_suggestion:edit',
            url='',
            open_type='',
            parent_id='60',
            icon='',
            sort=2,
            create_time=now_time,
            enable=1,
        ))
        print('添加权限: 产品建议编辑 (ID: 71)')
    
    if 72 not in existing_ids:
        from datetime import datetime
        now_time = datetime.now()
        new_permissions.append(Power(
            id=72,
            name='产品建议删除',
            type='2',
            code='system:product_suggestion:delete',
            url='',
            open_type='',
            parent_id='60',
            icon='',
            sort=3,
            create_time=now_time,
            enable=1,
        ))
        print('添加权限: 产品建议删除 (ID: 72)')
    
    if new_permissions:
        db.session.add_all(new_permissions)
        db.session.commit()
        print(f'\n成功添加 {len(new_permissions)} 个新权限')
    else:
        print('\n所有权限已存在，无需添加')
    
    # 给角色分配新权限
    print('\n=== 给角色分配权限 ===')
    
    # 给所有角色分配权限
    all_roles = Role.query.all()
    for role in all_roles:
        for power_id in [70, 71, 72]:
            power = Power.query.get(power_id)
            if power and power not in role.power:
                role.power.append(power)
                print(f'给角色 "{role.name}" 分配权限: {power.name}')
    db.session.commit()
    
    print('\n=== 同步完成 ===')
