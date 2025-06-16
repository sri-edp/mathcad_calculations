from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_cors import CORS
from config import Config
from app.utils.template_filters import register_filters

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()
cors = CORS()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions with app
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)

    login_manager.login_view = 'auth.login'

    # Register template filters
    register_filters(app)

    with app.app_context():
        # Import blueprints here to avoid circular imports
        from app.views.auth import auth_bp
        from app.views.dashboard import dashboard_bp
        from app.views.calculations import calc_bp
        from app.views.templates import templates_bp

        # Register blueprints
        app.register_blueprint(auth_bp)
        app.register_blueprint(dashboard_bp)
        app.register_blueprint(calc_bp)
        app.register_blueprint(templates_bp)

        # Create database tables if they don't exist
        db.create_all()

    # Register error handlers
    register_error_handlers(app)

    return app


def register_error_handlers(app):
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('errors/404.html'), 404

    @app.errorhandler(500)
    def internal_server_error(e):
        return render_template('errors/500.html'), 500

    @app.errorhandler(403)
    def forbidden(e):
        return render_template('errors/403.html'), 403

    @app.errorhandler(400)
    def bad_request(e):
        return render_template('errors/400.html'), 400