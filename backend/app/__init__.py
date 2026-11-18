import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.models import db, User
from config import config

jwt = JWTManager()

def create_app(config_name='default'):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config[config_name])

    # Ensure instance and uploads directories exist
    os.makedirs(app.instance_path, exist_ok=True)
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # JWT user loader callback
    @jwt.user_identity_loader
    def user_identity_lookup(user_id):
        return str(user_id)

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        return User.query.filter_by(id=int(identity)).one_or_none()

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired', 'code': 'token_expired'}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Signature verification failed', 'code': 'invalid_token'}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Request does not contain an access token', 'code': 'authorization_required'}), 401

    # Serve uploaded files securely
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # Health check
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'platform': 'HOSTEL MANAGEMENT SYSTEM',
            'version': '2.0.0'
        }), 200

    # Register blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.dashboard_routes import dashboard_bp
    from app.routes.students_routes import students_bp
    from app.routes.rooms_routes import rooms_bp
    from app.routes.admissions_routes import admissions_bp
    from app.routes.fees_routes import fees_bp
    from app.routes.attendance_routes import attendance_bp
    from app.routes.complaints_routes import complaints_bp
    from app.routes.maintenance_routes import maintenance_bp
    from app.routes.visitors_routes import visitors_bp
    from app.routes.leaves_routes import leaves_bp
    from app.routes.mess_routes import mess_bp
    from app.routes.staff_routes import staff_bp
    from app.routes.notifications_routes import notifications_bp
    from app.routes.reports_routes import reports_bp
    from app.routes.settings_routes import settings_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(rooms_bp)
    app.register_blueprint(admissions_bp)
    app.register_blueprint(fees_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(complaints_bp)
    app.register_blueprint(maintenance_bp)
    app.register_blueprint(visitors_bp)
    app.register_blueprint(leaves_bp)
    app.register_blueprint(mess_bp)
    app.register_blueprint(staff_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(settings_bp)

    # Global Error Handlers
    @app.errorhandler(404)
    def resource_not_found(e):
        return jsonify({'error': 'Requested resource was not found'}), 404

    @app.errorhandler(500)
    def internal_server_error(e):
        return jsonify({'error': 'An internal server error occurred'}), 500

    return app
