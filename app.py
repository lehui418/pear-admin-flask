from applications import create_app
import os

app = create_app()

if __name__ == '__main__':
    debug = os.environ.get('FLASK_DEBUG', '0').lower() in ('1', 'true', 'yes')
    app_env = os.environ.get("APP_ENV", "development").lower()
    if app_env in ("prod", "production") and debug:
        raise RuntimeError("FLASK_DEBUG must be disabled in production environment.")
    app.run(host='0.0.0.0', port=5000, debug=debug)
