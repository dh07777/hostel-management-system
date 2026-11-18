from flask import Blueprint, request, jsonify
from datetime import datetime
from app.models import db, LeaveApplication, Student
from app.utils.auth import get_current_user, warden_or_admin
from app.utils.audit import log_audit_trail
from flask_jwt_extended import jwt_required

leaves_bp = Blueprint('leaves', __name__, url_prefix='/api/leaves')

@leaves_bp.route('/', methods=['GET'])
@jwt_required()
def get_leaves():
    user = get_current_user()
    user_role = user.role.name if user.role else None

    status = request.args.get('status')
    student_id = request.args.get('student_id')

    if user_role == 'student':
        if not user.student_profile:
            return jsonify([]), 200
        student_id = user.student_profile.id

    query = LeaveApplication.query
    if status:
        query = query.filter_by(status=status)
    if student_id:
        query = query.filter_by(student_id=student_id)

    leaves = query.order_by(LeaveApplication.id.desc()).all()
    return jsonify([l.to_dict() for l in leaves]), 200

@leaves_bp.route('/', methods=['POST'])
@jwt_required()
def apply_leave():
    user = get_current_user()
    data = request.get_json() or {}

    student_id = data.get('student_id')
    if user.role and user.role.name == 'student':
        if not user.student_profile:
            return jsonify({'error': 'Student profile not found'}), 400
        student_id = user.student_profile.id

    student = Student.query.get_or_404(student_id)

    from_date_str = data.get('from_date')
    to_date_str = data.get('to_date')
    reason = data.get('reason', '').strip()
    parent_phone = data.get('parent_phone') or (student.parent_info.father_phone if student.parent_info else student.emergency_contact_phone)

    if not from_date_str or not to_date_str or not reason or not parent_phone:
        return jsonify({'error': 'From date, to date, reason, and parent phone are required'}), 400

    from_date = datetime.strptime(from_date_str, '%Y-%m-%d').date()
    to_date = datetime.strptime(to_date_str, '%Y-%m-%d').date()

    if to_date < from_date:
        return jsonify({'error': 'To date cannot be earlier than from date'}), 400

    count = LeaveApplication.query.count() + 1
    code = f"LEV-{datetime.utcnow().year}-{count:04d}"

    leave = LeaveApplication(
        leave_code=code,
        student_id=student.id,
        leave_type=data.get('leave_type', 'home'),
        from_date=from_date,
        to_date=to_date,
        reason=reason,
        parent_phone=parent_phone,
        parent_consent=bool(data.get('parent_consent', True)),
        status='pending'
    )
    db.session.add(leave)
    db.session.commit()

    log_audit_trail('APPLY_LEAVE', 'LEAVES', f"Student {student.student_id_code} applied for leave {code}")

    return jsonify({
        'message': f"Leave application {code} submitted successfully",
        'leave': leave.to_dict()
    }), 201

@leaves_bp.route('/<int:leave_id>/approve', methods=['PUT'])
@warden_or_admin
def approve_leave(leave_id):
    user = get_current_user()
    leave = LeaveApplication.query.get_or_404(leave_id)
    data = request.get_json() or {}

    leave.status = 'approved'
    leave.approved_by_id = user.id if user else None
    leave.approval_remarks = data.get('approval_remarks', 'Approved by warden')

    db.session.commit()
    log_audit_trail('APPROVE_LEAVE', 'LEAVES', f"Approved leave {leave.leave_code}")

    return jsonify({'message': f"Leave {leave.leave_code} approved", 'leave': leave.to_dict()}), 200

@leaves_bp.route('/<int:leave_id>/reject', methods=['PUT'])
@warden_or_admin
def reject_leave(leave_id):
    user = get_current_user()
    leave = LeaveApplication.query.get_or_404(leave_id)
    data = request.get_json() or {}

    leave.status = 'rejected'
    leave.approved_by_id = user.id if user else None
    leave.approval_remarks = data.get('approval_remarks', 'Rejected due to academic commitments or missing consent.')

    db.session.commit()
    log_audit_trail('REJECT_LEAVE', 'LEAVES', f"Rejected leave {leave.leave_code}")

    return jsonify({'message': f"Leave {leave.leave_code} rejected", 'leave': leave.to_dict()}), 200

@leaves_bp.route('/<int:leave_id>/return', methods=['PUT'])
@warden_or_admin
def confirm_return(leave_id):
    leave = LeaveApplication.query.get_or_404(leave_id)
    leave.status = 'completed'
    leave.actual_return_date = datetime.utcnow().date()
    db.session.commit()

    return jsonify({'message': 'Student return confirmed and marked as completed', 'leave': leave.to_dict()}), 200
