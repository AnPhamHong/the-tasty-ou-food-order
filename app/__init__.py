from flask import Flask
from flask_mail import Mail

# Khởi tạo Mail global
mail = Mail()
def create_app():
    app = Flask(__name__)
    app.secret_key = "NHFSJSAU873"

    
    # Cấu hình email
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = 'an.ph410@gmail.com'
    app.config['MAIL_PASSWORD'] = 'dlpl vegr kpuv rzob'
    app.config['MAIL_DEFAULT_SENDER'] = 'an.ph410@gmail.com'
    # Khởi tạo Mail với app
    mail.init_app(app)

    # import & register blueprints
    from app.routes.auth import auth_bp
    from app.routes.restaurants import restaurants_bp
    from app.routes.brands import brands_bp
    from app.routes.pages import pages_bp
    from app.routes.account import account_bp
    from app.routes.blogs import blogs_bp
    from app.routes.orders import orders_bp 
    from app.routes.menu import menu_bp
    from app.routes.search import search_bp
    from app.routes.seller import seller_bp
    from app.routes.otp import otp_bp

    app.register_blueprint(otp_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(restaurants_bp)
    app.register_blueprint(brands_bp)
    app.register_blueprint(pages_bp)
    app.register_blueprint(blogs_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(account_bp, url_prefix="/account")
    app.register_blueprint(menu_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(seller_bp)

    return app
