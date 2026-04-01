import datetime
from functools import wraps
from flask import request, g
from flask_login import current_user

from flask.cli import AppGroup

from applications.extensions import db
from applications.models import User, Role, Dept, Power
from applications.models.admin_log import OperationLog

admin_cli = AppGroup("admin")

now_time = datetime.datetime.now()
userdata = [
    User(
        id=1,
        username='admin',
        password_hash='pbkdf2:sha256:150000$raM7mDSr$58fe069c3eac01531fc8af85e6fc200655dd2588090530084d182e6ec9d52c85',
        create_at=now_time,
        enable=1,
        realname='超级管理',
        remark='要是不能把握时机，就要终身蹭蹬，一事无成！',
        avatar='/static/system/admin/images/avatar.jpg',
        dept_id=1,
    ),
    User(
        id=2,
        username='test',
        password_hash='pbkdf2:sha256:150000$cRS8bYNh$adb57e64d929863cf159f924f74d0634f1fecc46dba749f1bfaca03da6d2e3ac',
        create_at=now_time,
        enable=1,
        realname='测试',
        remark='要是不能把握时机，就要终身蹭蹬，一事无成！',
        avatar='/static/system/admin/images/avatar.jpg',
        dept_id=1,
    ),
    User(
        id='3',
        username='wind',
        password_hash='pbkdf2:sha256:150000$skME1obT$6a2c20cd29f89d7d2f21d9e373a7e3445f70ebce3ef1c3a555e42a7d17170b37',
        create_at=now_time,
        enable=1,
        realname='风',
        remark='要是不能把握时机，就要终身蹭蹬，一事无成！',
        avatar='/static/system/admin/images/avatar.jpg',
        dept_id=7,
    ),
]
roledata = [
    Role(
        id=1,
        code='admin',
        name='管理员',
        enable=1,
        details='管理员',
        sort=1,
        create_time=now_time,
    ),
    Role(
        id=2,
        code='common',
        name='普通用户',
        enable=1,
        details='只有查看，没有增删改权限',
        sort=2,
        create_time=now_time,
    )
]
deptdata = [
    Dept(
        id=1,
        parent_id=0,
        dept_name='总公司',
        sort=1,
        leader='就眠仪式',
        phone='12312345679',
        email='123qq.com',
        status=1,
        remark='这是总公司',
        create_at=now_time
    ),
    Dept(
        id=4,
        parent_id=1,
        dept_name='济南分公司',
        sort=2,
        leader='就眠仪式',
        phone='12312345679',
        email='123qq.com',
        status=1,
        remark='这是济南',
        create_at=now_time

    ),
    Dept(
        id=5,
        parent_id=1,
        dept_name='唐山分公司',
        sort=4,
        leader='mkg',
        phone='12312345679',
        email='123qq.com',
        status=1,
        remark='这是唐山',
        create_at=now_time

    ),
    Dept(
        id=7,
        parent_id=4,
        dept_name='济南分公司开发部',
        sort=5,
        leader='就眠仪式',
        phone='12312345679',
        email='123qq.com',
        status=1,
        remark='测试',
        create_at=now_time

    ),
    Dept(
        id=8,
        parent_id=5,
        dept_name='唐山测试部',
        sort=5,
        leader='mkg',
        phone='12312345679',
        email='123qq.com',
        status=1,
        remark='测试部',
        create_at=now_time

    )
]
powerdata = [
    Power(
        id=1,
        name='系统管理',
        type='0',
        code='',
        url=None,
        open_type=None,
        parent_id='0',
        icon='layui-icon layui-icon-set-fill',
        sort=1,
        create_time=now_time,
        enable=1,

    ), Power(
        id=3,
        name='用户管理',
        type='1',
        code='system:user:main',
        url='/system/user/',
        open_type='_iframe',
        parent_id='1',
        icon='layui-icon layui-icon layui-icon layui-icon layui-icon-rate',
        sort=1,
        create_time=now_time,
        enable=1,

    ), Power(
        id=4,
        name='权限管理',
        type='1',
        code='system:power:main',
        url='/system/power/',
        open_type='_iframe',
        parent_id='1',
        icon=None,
        sort=2,
        create_time=now_time,
        enable=1,

    ), Power(
        id=9,
        name='角色管理',
        type='1',
        code='system:role:main',
        url='/system/role/',
        open_type='_iframe',
        parent_id='1',
        icon='layui-icon layui-icon-username',
        sort=2,
        create_time=now_time,
        enable=1,

    ), Power(
        id=12,
        name='系统监控',
        type='1',
        code='system:monitor:main',
        url='/system/monitor/',
        open_type='_iframe',
        parent_id='1',
        icon='layui-icon layui-icon-vercode',
        sort=5,
        create_time=now_time,
        enable=1,

    ), Power(
        id=13,
        name='日志管理',
        type='1',
        code='system:log:main',
        url='/system/log/',
        open_type='_iframe',
        parent_id='1',
        icon='layui-icon layui-icon-read',
        sort=4,
        create_time=now_time,
        enable=1,

    ), Power(
        id=17,
        name='文件管理',
        type='0',
        code='',
        url='',
        open_type='',
        parent_id='0',
        icon='layui-icon layui-icon-camera',
        sort=2,
        create_time=now_time,
        enable=1,

    ), Power(
        id=18,
        name='图片上传',
        type='1',
        code='system:file:main',
        url='/system/file/',
        open_type='_iframe',
        parent_id='17',
        icon='layui-icon layui-icon-camera',
        sort=5,
        create_time=now_time,
        enable=1,

    ), Power(
        id=21,
        name='权限增加',
        type='2',
        code='system:power:add',
        url='',
        open_type='',
        parent_id='4',
        icon='layui-icon layui-icon-add-circle',
        sort=1,
        create_time=now_time,
        enable=1,

    ), Power(
        id=22,
        name='用户增加',
        type='2',
        code='system:user:add',
        url='',
        open_type='',
        parent_id='3',
        icon='layui-icon layui-icon-add-circle',
        sort=1,
        create_time=now_time,
        enable=1,

    ), Power(
        id=23,
        name='用户编辑',
        type='2',
        code='system:user:edit',
        url='',
        open_type='',
        parent_id='3',
        icon='layui-icon layui-icon-rate',
        sort=2,
        create_time=now_time,
        enable=1,

    ), Power(
        id=24,
        name='用户删除',
        type='2',
        code='system:user:remove',
        url='',
        open_type='',
        parent_id='3',
        icon='',
        sort=3,
        create_time=now_time,
        enable=1,

    ), Power(
        id=25,
        name='权限编辑',
        type='2',
        code='system:power:edit',
        url='',
        open_type='',
        parent_id='4',
        icon='',
        sort=2,
        create_time=now_time,
        enable=1,

    ), Power(
        id=26,
        name='权限删除',
        type='2',
        code='system:power:remove',
        url='',
        open_type='',
        parent_id='4',
        icon='',
        sort=3,
        create_time=now_time,
        enable=1,

    ), Power(
        id=27,
        name='用户增加',
        type='2',
        code='system:role:add',
        url='',
        open_type='',
        parent_id='9',
        icon='',
        sort=1,
        create_time=now_time,
        enable=1,

    ), Power(
        id=28,
        name='角色编辑',
        type='2',
        code='system:role:edit',
        url='',
        open_type='',
        parent_id='9',
        icon='',
        sort=2,
        create_time=now_time,
        enable=1,

    ), Power(
        id=29,
        name='角色删除',
        type='2',
        code='system:role:remove',
        url='',
        open_type='',
        parent_id='9',
        icon='',
        sort=3,
        create_time=now_time,
        enable=1,

    ), Power(
        id=30,
        name='角色授权',
        type='2',
        code='system:role:power',
        url='',
        open_type='',
        parent_id='9',
        icon='',
        sort=4,
        create_time=now_time,
        enable=1,

    ), Power(
        id=31,
        name='图片增加',
        type='2',
        code='system:file:add',
        url='',
        open_type='',
        parent_id='18',
        icon='',
        sort=1,
        create_time=now_time,
        enable=1,

    ), Power(
        id=32,
        name='图片删除',
        type='2',
        code='system:file:delete',
        url='',
        open_type='',
        parent_id='18',
        icon='',
        sort=2,
        create_time=now_time,
        enable=1,

    ), Power(
        id=44,
        name='数据字典',
        type='1',
        code='system:dict:main',
        url='/system/dict/',
        open_type='_iframe',
        parent_id='1',
        icon='layui-icon layui-icon-console',
        sort=6,
        create_time=now_time,
        enable=1,

    ), Power(
        id=45,
        name='字典增加',
        type='2',
        code='system:dict:add',
        url='',
        open_type='',
        parent_id='44',
        icon='',
        sort=1,
        create_time=now_time,
        enable=1,

    ), Power(
        id=46,
        name='字典修改',
        type='2',
        code='system:dict:edit',
        url='',
        open_type='',
        parent_id='44',
        icon='',
        sort=2,
        create_time=now_time,
        enable=1,

    ), Power(
        id=47,
        name='字典删除',
        type='2',
        code='system:dict:remove',
        url='',
        open_type='',
        parent_id='44',
        icon='',
        sort=3,
        create_time=now_time,
        enable=1,

    ), Power(
        id=48,
        name='部门管理',
        type='1',
        code='system:dept:main',
        url='/system/dept/',
        open_type='_iframe',
        parent_id='1',
        icon='layui-icon layui-icon-group',
        sort=3,
        create_time=now_time,
        enable=1,

    ), Power(
        id=49,
        name='部门增加',
        type='2',
        code='system:dept:add',
        url='',
        open_type='',
        parent_id='48',
        icon='',
        sort=1,
        create_time=now_time,
        enable=1,

    ), Power(
        id=50,
        name='部门编辑',
        type='2',
        code='system:dept:edit',
        url='',
        open_type='',
        parent_id='48',
        icon='',
        sort=2,
        create_time=now_time,
        enable=1,

    ), Power(
        id=51,
        name='部门删除',
        type='2',
        code='system:dept:remove',
        url='',
        open_type='',
        parent_id='48',
        icon='',
        sort=3,
        create_time=now_time,
        enable=1,

    ), Power(
        id=57,
        name='邮件管理',
        type='1',
        code='system:mail:main',
        url='/system/mail/',
        open_type='_iframe',
        parent_id='1',
        icon='layui-icon ',
        sort=7,
        create_time=now_time,
        enable=1,

    ), Power(
        id=58,
        name='邮件发送',
        type='2',
        code='system:mail:add',
        url='',
        open_type='',
        parent_id='57',
        icon='layui-icon layui-icon-ok-circle',
        sort=1,
        create_time=now_time,
        enable=1,

    ), Power(
        id=59,
        name='邮件删除',
        type='2',
        code='system:mail:remove',
        url='',
        open_type='',
        parent_id='57',
        icon='',
        sort=2,
        create_time=now_time,
        enable=1,

    ), Power(
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

    ), Power(
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

    ), Power(
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

    ), Power(
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

    ), Power(
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


def add_user_role():
    admin_role = Role.query.filter_by(id=1).first()
    admin_user = User.query.filter_by(id=1).first()
    admin_user.role.append(admin_role)
    test_role = Role.query.filter_by(id=2).first()
    test_user = User.query.filter_by(id=2).first()
    test_user.role.append(test_role)
    db.session.commit()


def add_role_power():
    admin_powers = Power.query.filter(Power.id.in_([1, 3, 4, 9, 12, 13, 17, 18, 44, 48, 60, 61, 70, 71, 72])).all()
    admin_user = Role.query.filter_by(id=2).first()
    for i in admin_powers:
        admin_user.power.append(i)
    db.session.commit()


@admin_cli.command("init")
def init_db():
    db.session.add_all(userdata)
    print("加载系统必须用户数据")
    db.session.add_all(roledata)
    print("加载系统必须角色数据")
    db.session.add_all(deptdata)
    print("加载系统必须部门数据")
    db.session.add_all(powerdata)
    print("加载系统必须权限数据")
    db.session.commit()
    print("基础数据存入")
    add_user_role()
    print("用户角色数据存入")
    add_role_power()
    print("角色权限数据存入")
    print("数据初始化完成，请使用run脚本运行")

def login_log(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 记录登录日志
        # ...
        return f(*args, **kwargs)
    return decorated_function

def operation_log(description=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # 先执行视图函数，以便在函数内部准备好动态描述所需的数据
            response = f(*args, **kwargs)
            
            # 如果是重定向响应，通常不记录日志
            if response.status_code in [301, 302]:
                return response

            # 动态生成描述
            log_desc = ""
            if callable(description):
                # 如果描述是函数，调用它来获取动态描述
                # 我们可以通过 g 对象在视图函数和装饰器之间传递数据
                try:
                    log_desc = description()
                except Exception as e:
                    log_desc = "动态生成日志描述失败"
            else:
                log_desc = description

            # 记录操作日志
            log = OperationLog(
                uid=current_user.id,
                url=request.path,
                method=request.method,
                ip=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                content_type=request.content_type,
                desc=log_desc
            )
            db.session.add(log)
            db.session.commit()
            
            return response
        return decorated_function
    return decorator
