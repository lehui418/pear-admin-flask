from flask import jsonify, render_template, request


def _is_json_request():
    if request.path.startswith("/api/"):
        return True
    best = request.accept_mimetypes.best
    return best == "application/json"


def _json_error(status_code, message):
    return jsonify({"code": status_code, "msg": message, "data": None}), status_code


def init_error_views(app):
    @app.errorhandler(403)
    def page_forbidden(e):
        app.logger.warning("403 Forbidden: %s - IP: %s", request.path, request.remote_addr)
        if _is_json_request():
            return _json_error(403, "Forbidden")
        return render_template("errors/403.html"), 403

    @app.errorhandler(404)
    def page_not_found(e):
        app.logger.warning("404 Not Found: %s - IP: %s", request.path, request.remote_addr)
        if _is_json_request():
            return _json_error(404, "Not Found")
        return render_template("errors/404.html"), 404

    @app.errorhandler(500)
    def internal_server_error(e):
        app.logger.error(
            "500 Internal Server Error: %s - IP: %s", request.path, request.remote_addr, exc_info=True
        )
        if _is_json_request():
            return _json_error(500, "Internal Server Error")
        return render_template("errors/500.html"), 500
