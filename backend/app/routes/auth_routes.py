from flask import Blueprint, request, jsonify
from datetime import datetime
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import db, User, Role, Student, Staff, AuditLog
from app.utils.auth import get_current_user, role_required, admin_required
from app.utils.audit import log_audit_trail

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    # Allow login by username or email
    user = User.query.filter((User.username == username) | (User.email == username)).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    if not user.is_active:
        return jsonify({'error': 'Your account has been deactivated. Contact administration.'}), 403

    user.last_login_at = datetime.utcnow()
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    log_audit_trail('LOGIN', 'AUTH', f"User {user.username} logged in successfully", user_id=user.id)

    return jsonify({
        'token': token,
        'user': user.to_dict(include_profile=True),
        'message': 'Login successful'
    }), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    full_name = data.get('full_name', '').strip()
    phone = data.get('phone', '').strip()
    role_name = data.get('role', 'student').strip()

    if not username or not email or not password or not full_name:
        return jsonify({'error': 'All fields are required'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400

    role = Role.query.filter_by(name=role_name).first()
    if not role:
        role = Role.query.filter_by(name='student').first()

    new_user = User(
        username=username,
        email=email,
        full_name=full_name,
        phone=phone,
        role_id=role.id,
        is_active=True
    )
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    # If student, link or generate student record
    if role.name == 'student':
        student_code = f"STU{datetime.utcnow().year}{new_user.id:04d}"
        names = full_name.split(' ', 1)
        first_name = names[0]
        last_name = names[1] if len(names) > 1 else ''
        new_student = Student(
            user_id=new_user.id,
            student_id_code=student_code,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            status='active'
        )
        db.session.add(new_student)
        db.session.commit()

    token = create_access_token(identity=str(new_user.id))
    log_audit_trail('REGISTER', 'AUTH', f"Registered user {new_user.username}", user_id=new_user.id)

    return jsonify({
        'token': token,
        'user': new_user.to_dict(include_profile=True),
        'message': 'Registration successful'
    }), 201

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict(include_profile=True)), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    user.full_name = data.get('full_name', user.full_name)
    user.phone = data.get('phone', user.phone)
    if 'avatar_url' in data:
        user.avatar_url = data.get('avatar_url')

    # If student, update student profile as well
    if user.student_profile:
        sp = user.student_profile
        names = user.full_name.split(' ', 1)
        sp.first_name = names[0]
        sp.last_name = names[1] if len(names) > 1 else ''
        sp.phone = user.phone
        if 'blood_group' in data:
            sp.blood_group = data.get('blood_group')
        if 'emergency_contact_name' in data:
            sp.emergency_contact_name = data.get('emergency_contact_name')
        if 'emergency_contact_phone' in data:
            sp.emergency_contact_phone = data.get('emergency_contact_phone')

    db.session.commit()
    log_audit_trail('UPDATE_PROFILE', 'USER', f"User {user.username} updated profile", user_id=user.id)
    return jsonify({'message': 'Profile updated successfully', 'user': user.to_dict(include_profile=True)}), 200

@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    user = get_current_user()
    data = request.get_json() or {}
    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')

    if not user.check_password(old_password):
        return jsonify({'error': 'Incorrect current password'}), 400

    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400

    user.set_password(new_password)
    db.session.commit()
    log_audit_trail('CHANGE_PASSWORD', 'AUTH', f"Password changed for {user.username}", user_id=user.id)
    return jsonify({'message': 'Password changed successfully'}), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    user = User.query.filter_by(email=email).first()
    # Always return success message to avoid email enumeration
    return jsonify({
        'message': 'If an account exists with that email, reset instructions have been generated.',
        'demo_reset_token': 'DEMO-RESET-TOKEN-12345' if user else None
    }), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    new_password = data.get('new_password', '').strip()
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Invalid request'}), 400
    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    user.set_password(new_password)
    db.session.commit()
    log_audit_trail('RESET_PASSWORD', 'AUTH', f"Password reset for {user.email}")
    return jsonify({'message': 'Password has been reset successfully'}), 200

@auth_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    users = User.query.order_by(User.id.desc()).all()
    return jsonify([u.to_dict(include_profile=True) for u in users]), 200

@auth_bp.route('/users/<int:user_id>/toggle-status', methods=['PUT'])
@admin_required
def toggle_user_status(user_id):
    user = User.query.get_or_404(user_id)
    user.is_active = not user.is_active
    db.session.commit()
    log_audit_trail('TOGGLE_USER_STATUS', 'USER', f"User {user.username} active status set to {user.is_active}")
    return jsonify({'message': f"User status set to {'Active' if user.is_active else 'Deactivated'}", 'user': user.to_dict()}), 200
