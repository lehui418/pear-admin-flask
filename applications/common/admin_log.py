from flask_login import current_user

from applications.common.utils.validate import str_escape
from applications.extensions import db
from applications.models import AdminLog


def normal_log(method, url, ip, user_agent, desc, uid, is_access):
    info = {
        'method': method,
        'url': url,
        'ip': ip,
        'user_agent': user_agent,
        'desc': desc,
        'uid': uid,
        'success': int(is_access)
    }
    log = AdminLog(
        url=info.get('url'),
        ip=info.get('ip'),
        user_agent=info.get('user_agent'),
        desc=info.get('desc'),
        uid=info.get('uid'),
        method=info.get('method'),
        success=info.get('success')
    )
    db.session.add(log)
    db.session.commit()
    return log.id


def login_log(request, uid, is_access):
    method = request.method
    url = request.path
    ip = request.remote_addr
    user_agent = str_escape(request.headers.get('User-Agent'))
    desc = str_escape(request.form.get('username'))
    return normal_log(method, url, ip, user_agent, desc, uid, is_access)


def admin_log(request, is_access, desc=None):
    method = request.method
    url = request.path
    ip = request.remote_addr
    user_agent = str_escape(request.headers.get('User-Agent'))
    request_data = request.json if request.headers.get('Content-Type') == 'application/json' else request.values
    if desc is None:
        desc = str_escape(str(dict(request_data)))
    return normal_log(method, url, ip, user_agent, desc, current_user.id, is_access)
