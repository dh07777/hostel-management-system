from flask import Blueprint, request, jsonify
from datetime import datetime
from app.models import db, Complaint, ComplaintUpdate, Staff, Student
from app.utils.auth import get_current_user, warden_or_admin
from app.utils.audit import log_audit_trail
from flask_jwt_extended import jwt_required

complaints_bp = Blueprint('complaints', __name__, url_prefix='/api/complaints')

@complaints_bp.route('/', methods=['GET'])
@jwt_required()
def get_complaints():
    user = get_current_user()
    user_role = user.role.name if user.role else None

    category = request.args.get('category')
    status = request.args.get('status')
    priority = request.args.get('priority')

    query = Complaint.query
    if user_role == 'student':
        if not user.student_profile:
            return jsonify([]), 200
        query = query.filter_by(student_id=user.student_profile.id)

    if category:
        query = query.filter_by(category=category)
    if status:
        query = query.filter_by(status=status)
    if priority:
        query = query.filter_by(priority=priority)

    complaints = query.order_by(Complaint.id.desc()).all()
    return jsonify([c.to_dict(include_updates=True) for c in complaints]), 200

@complaints_bp.route('/', methods=['POST'])
@jwt_required()
def submit_complaint():
    user = get_current_user()
    data = request.get_json() or {}

    student_id = data.get('student_id')
    if user.role and user.role.name == 'student':
        if not user.student_profile:
            return jsonify({'error': 'Student profile not found'}), 400
        student_id = user.student_profile.id

    if not student_id:
        return jsonify({'error': 'Student ID is required'}), 400

    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    category = data.get('category', 'other')
    priority = data.get('priority', 'medium')

    if not title or not description:
        return jsonify({'error': 'Title and description are required'}), 400

    count = Complaint.query.count() + 1
    year = datetime.utcnow().year
    code = f"CMP-{year}-{count:04d}"

    complaint = Complaint(
        complaint_code=code,
        student_id=student_id,
        category=category,
        title=title,
        description=description,
        priority=priority,
        status='submitted',
        image_url=data.get('image_url')
    )
    db.session.add(complaint)
    db.session.flush()

    # Initial update log
    update = ComplaintUpdate(
        complaint_id=complaint.id,
        user_id=user.id,
        old_status=None,
        new_status='submitted',
        comment='Complaint filed into system'
    )
    db.session.add(update)
    db.session.commit()

    log_audit_trail('SUBMIT_COMPLAINT', 'COMPLAINTS', f"Complaint {code} submitted by user {user.username}")

    return jsonify({
        'message': f"Complaint {code} submitted successfully",
        'complaint': complaint.to_dict(include_updates=True)
    }), 201

@complaints_bp.route('/<int:complaint_id>/status', methods=['PUT'])
@warden_or_admin
def update_complaint_status(complaint_id):
    user = get_current_user()
    complaint = Complaint.query.get_or_404(complaint_id)
    data = request.get_json() or {}

    new_status = data.get('status', complaint.status)
    comment = data.get('comment', 'Status updated by administrator')
    assigned_to_staff_id = data.get('assigned_to_staff_id')
    resolution_notes = data.get('resolution_notes')

    old_status = complaint.status
    complaint.status = new_status

    if assigned_to_staff_id:
        complaint.assigned_to_staff_id = assigned_to_staff_id

    if resolution_notes:
        complaint.resolution_notes = resolution_notes

    if new_status == 'resolved':
        complaint.resolved_at = datetime.utcnow()

    # Log update record
    update = ComplaintUpdate(
        complaint_id=complaint.id,
        user_id=user.id,
        old_status=old_status,
        new_status=new_status,
        comment=comment
    )
    db.session.add(update)
    db.session.commit()

    log_audit_trail('UPDATE_COMPLAINT_STATUS', 'COMPLAINTS', f"Complaint {complaint.complaint_code} status: {old_status} -> {new_status}")

    return jsonify({
        'message': 'Complaint status updated',
        'complaint': complaint.to_dict(include_updates=True)
    }), 200

@complaints_bp.route('/<int:complaint_id>/feedback', methods=['POST'])
@jwt_required()
def submit_complaint_feedback(complaint_id):
    user = get_current_user()
    complaint = Complaint.query.get_or_404(complaint_id)
    data = request.get_json() or {}

    rating = int(data.get('rating', 5))
    comment = data.get('comment', '')

    complaint.feedback_rating = rating
    complaint.feedback_comment = comment

    db.session.commit()
    return jsonify({'message': 'Feedback submitted successfully', 'complaint': complaint.to_dict()}), 200
