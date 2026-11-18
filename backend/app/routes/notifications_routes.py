from flask import Blueprint, request, jsonify
from datetime import datetime
from app.models import db, Notification, Announcement, User
from app.utils.auth import get_current_user, warden_or_admin
from app.utils.audit import log_audit_trail
from flask_jwt_extended import jwt_required

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_notifications():
    user = get_current_user()
    notifications = Notification.query.filter_by(user_id=user.id).order_by(Notification.created_at.desc()).limit(50).all()
    unread_count = Notification.query.filter_by(user_id=user.id, is_read=False).count()
    return jsonify({
        'notifications': [n.to_dict() for n in notifications],
        'unread_count': unread_count
    }), 200

@notifications_bp.route('/<int:notif_id>/read', methods=['PUT'])
@jwt_required()
def mark_read(notif_id):
    user = get_current_user()
    notif = Notification.query.filter_by(id=notif_id, user_id=user.id).first_or_404()
    notif.is_read = True
    notif.read_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Marked as read', 'notification': notif.to_dict()}), 200

@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    user = get_current_user()
    Notification.query.filter_by(user_id=user.id, is_read=False).update({
        'is_read': True,
        'read_at': datetime.utcnow()
    })
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read'}), 200

# ----------------- ANNOUNCEMENTS -----------------
@notifications_bp.route('/announcements', methods=['GET'])
@jwt_required()
def get_announcements():
    user = get_current_user()
    user_role = user.role.name if user.role else 'all'
    
    # Target audience filtering: 'all' or specific role
    announcements = Announcement.query.filter(
        (Announcement.target_audience == 'all') | 
        (Announcement.target_audience == user_role)
    ).order_by(Announcement.is_emergency.desc(), Announcement.created_at.desc()).all()

    return jsonify([a.to_dict() for a in announcements]), 200

@notifications_bp.route('/announcements', methods=['POST'])
@warden_or_admin
def create_announcement():
    user = get_current_user()
    data = request.get_json() or {}

    title = data.get('title', '').strip()
    content = data.get('content', '').strip()
    priority = data.get('priority', 'normal')
    target_audience = data.get('target_audience', 'all')
    is_emergency = bool(data.get('is_emergency', False))

    if not title or not content:
        return jsonify({'error': 'Title and content are required'}), 400

    announcement = Announcement(
        title=title,
        content=content,
        priority=priority,
        target_audience=target_audience,
        is_emergency=is_emergency,
        published_by_id=user.id if user else None
    )
    db.session.add(announcement)
    db.session.commit()

    log_audit_trail('CREATE_ANNOUNCEMENT', 'NOTIFICATIONS', f"Published announcement: {title}")
    return jsonify(announcement.to_dict()), 201

@notifications_bp.route('/announcements/<int:ann_id>', methods=['DELETE'])
@warden_or_admin
def delete_announcement(ann_id):
    announcement = Announcement.query.get_or_404(ann_id)
    db.session.delete(announcement)
    db.session.commit()
    return jsonify({'message': 'Announcement deleted'}), 200
