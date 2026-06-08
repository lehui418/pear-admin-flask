import logging
import os
import uuid
from logging.handlers import RotatingFileHandler

from flask import Flask, g, request, has_request_context
from sqlalchemy import text

from applications.common.script import init_script
from applications.config import BaseConfig
from applications.extensions import db
from applications.extensions import init_plugs
from applications.view import init_bps


def create_app():
    app = Flask(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    app.config.from_object(BaseConfig)

    configure_logging(app)
    init_plugs(app)
    init_bps(app)
    init_script(app)

    @app.get("/health")
    def health():
        try:
            db.session.execute(text("SELECT 1"))
            return {"status": "ok", "db": "ok"}, 200
        except Exception:
            app.logger.exception("health check failed")
            return {"status": "degraded", "db": "error"}, 503

    @app.before_request
    def attach_request_id():
        rid = request.headers.get("X-Request-ID") or uuid.uuid4().hex
        g.request_id = rid

    @app.after_request
    def add_response_headers(response):
        rid = getattr(g, "request_id", None)
        if rid:
            response.headers["X-Request-ID"] = rid
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

    return app


def configure_logging(app):
    class RequestIdFilter(logging.Filter):
        def filter(self, record):
            record.request_id = getattr(g, "request_id", "-") if has_request_context() else "-"
            return True

    log_dir = os.path.join(app.root_path, "logs")
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    logging.basicConfig(level=app.config["LOG_LEVEL"])

    console_handler = logging.StreamHandler()
    console_handler.setLevel(app.config["LOG_LEVEL"])

    file_handler = RotatingFileHandler(
        filename=os.path.join(log_dir, "pear-admin.log"),
        maxBytes=app.config.get("LOG_MAX_BYTES", 10 * 1024 * 1024),
        backupCount=app.config.get("LOG_BACKUP_COUNT", 5),
        encoding="utf-8",
    )
    file_handler.setLevel(app.config.get("LOG_FILE_LEVEL", logging.INFO))

    formatter = logging.Formatter(
        fmt=app.config.get(
            "LOG_FORMAT",
            "%(asctime)s - %(name)s - %(levelname)s - [req:%(request_id)s] - %(message)s",
        ),
        datefmt=app.config.get("LOG_DATE_FORMAT", "%Y-%m-%d %H:%M:%S"),
    )

    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)
    console_handler.addFilter(RequestIdFilter())
    file_handler.addFilter(RequestIdFilter())

    root_logger = logging.getLogger()
    root_logger.handlers = []
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)

    werkzeug_logger = logging.getLogger("werkzeug")
    werkzeug_logger.setLevel(app.config["LOG_LEVEL"])

    app.logger.info("Application started")
