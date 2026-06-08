#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
同步工单分析权限到数据库
"""

from applications import create_app
from applications.extensions import db
from applications.models import Power, Role

app = create_app()

with app.app_context():
    print('=== 开始同步工单分析权限 ===')
    
    # 查找最大的权限ID
    max_power = Power.query.order_by(Power.id.desc()).first()
    new_id = max_power.id + 1 if max_power else 1
    print(f'\n最大权限ID: {max_power.id if max_power else 0}, 新权限ID: {new_id}')
    
    # 检查权限是否已存在
    existing_power = Power.query.filter_by(code='system:ticket:analytics').first()
    if existing_power:
        print(f'权限已存在: {existing_power.name} (ID: {existing_power.id})')
        new_power = existing_power
    else:
        from datetime import datetime
        now_time = datetime.now()
        
        # 添加工单分析权限
        new_power = Power(
            id=new_id,
            name='工单分析',
            type='2',  # 按钮权限
            code='system:ticket:analytics',
            url='',
            open_type='',
            parent_id='61',  # 工单管理的ID
            icon='',
            sort=1,
            create_time=now_time,
            enable=1,
        )
        db.session.add(new_power)
        db.session.commit()
        print(f'添加权限: 工单分析 (ID: {new_id}, Code: system:ticket:analytics)')
    
    # 给所有角色分配权限
    print('\n=== 给角色分配权限 ===')
    all_roles = Role.query.all()
    for role in all_roles:
        if new_power not in role.power:
            role.power.append(new_power)
            print(f'给角色 "{role.name}" 分配权限: 工单分析')
    db.session.commit()
    
    print('\n=== 同步完成 ===')
