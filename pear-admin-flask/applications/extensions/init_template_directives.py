from flask import session, current_app
from datetime import datetime
from flask_login import current_user


def init_template_directives(app):
    @app.template_global()
    def authorize(power):
        if current_user.username != current_app.config.get("SUPERADMIN"):
            permissions = session.get('permissions') or []
            return bool(power in permissions)
        else:
            return True

    @app.template_filter()
    def format_datetime(value, format_str='%Y-%m-%d %H:%M:%S'):
        if isinstance(value, datetime):
            return value.strftime(format_str)
        return ""
