from flask import Flask
from app.db import db_config

def create_app():
    app = Flask(__name__)
    app.secret_key = "NHFSJSAU873"

    # import & register blueprints
    from app.routes.auth import auth_bp
    from app.routes.restaurants import restaurants_bp
    from app.routes.brands import brands_bp
    from app.routes.pages import pages_bp
    from app.routes.account import account_bp
    from app.routes.blogs import blogs_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(restaurants_bp)
    app.register_blueprint(brands_bp)
    app.register_blueprint(pages_bp)
    app.register_blueprint(account_bp)
    app.register_blueprint(blogs_bp)

    return app
