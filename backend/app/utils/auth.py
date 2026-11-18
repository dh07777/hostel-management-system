from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models import User

def get_current_user():
    verify_jwt_in_request()
    identity = get_jwt_identity()
    user = User.query.get(identity)
    return user

def role_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            identity = get_jwt_identity()
            user = User.query.get(identity)
            if not user or not user.is_active:
                return jsonify({'error': 'Account is inactive or not found'}), 401
            
            user_role = user.role.name if user.role else None
            # Super admin always has access
            if user_role == 'super_admin' or user_role in allowed_roles:
                return fn(*args, **kwargs)
            
            return jsonify({'error': 'Forbidden: Insufficient privileges'}), 403
        return wrapper
    return decorator

def admin_required(fn):
    return role_required('super_admin', 'hostel_admin')(fn)

def warden_or_admin(fn):
    return role_required('super_admin', 'hostel_admin', 'warden')(fn)

def accountant_or_admin(fn):
    return role_required('super_admin', 'hostel_admin', 'accountant')(fn)
