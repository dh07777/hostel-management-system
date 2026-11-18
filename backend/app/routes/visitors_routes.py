from flask import Blueprint, request, jsonify
from datetime import datetime
from app.models import db, Visitor, Student
from app.utils.auth import get_current_user, warden_or_admin
from app.utils.audit import log_audit_trail
from flask_jwt_extended import jwt_required

visitors_bp = Blueprint('visitors', __name__, url_prefix='/api/visitors')

@visitors_bp.route('/', methods=['GET'])
@jwt_required()
def get_visitors():
    status = request.args.get('status')
    student_id = request.args.get('student_id')
    user = get_current_user()

    if user.role and user.role.name == 'student':
        if not user.student_profile:
            return jsonify([]), 200
        student_id = user.student_profile.id

    query = Visitor.query
    if status:
        query = query.filter_by(status=status)
    if student_id:
        query = query.filter_by(student_id=student_id)

    visitors = query.order_by(Visitor.check_in_time.desc()).all()
    return jsonify([v.to_dict() for v in visitors]), 200

@visitors_bp.route('/active', methods=['GET'])
@warden_or_admin
def get_active_visitors():
    visitors = Visitor.query.filter_by(status='checked_in').order_by(Visitor.check_in_time.desc()).all()
    return jsonify([v.to_dict() for v in visitors]), 200

@visitors_bp.route('/', methods=['POST'])
@warden_or_admin
def register_visitor():
    user = get_current_user()
    data = request.get_json() or {}

    name = data.get('visitor_name', '').strip()
    phone = data.get('phone', '').strip()
    student_id = data.get('student_id')
    purpose = data.get('purpose', '').strip()

    if not name or not phone or not student_id or not purpose:
        return jsonify({'error': 'Visitor name, phone, student, and purpose are required'}), 400

    student = Student.query.get_or_404(student_id)

    visitor = Visitor(
        visitor_name=name,
        phone=phone,
        id_proof_type=data.get('id_proof_type', 'National ID'),
        id_proof_number=data.get('id_proof_number'),
        student_id=student.id,
        purpose=purpose,
        check_in_time=datetime.utcnow(),
        status='checked_in',
        approved_by_id=user.id if user else None,
        vehicle_number=data.get('vehicle_number'),
        remarks=data.get('remarks')
    )
    db.session.add(visitor)
    db.session.commit()

    log_audit_trail('REGISTER_VISITOR', 'VISITORS', f"Registered visitor {name} for Student {student.student_id_code}")

    return jsonify(visitor.to_dict()), 201

@visitors_bp.route('/<int:visitor_id>/checkout', methods=['PUT'])
@warden_or_admin
def checkout_visitor(visitor_id):
    visitor = Visitor.query.get_or_404(visitor_id)
    visitor.status = 'checked_out'
    visitor.check_out_time = datetime.utcnow()
    db.session.commit()

    log_audit_trail('CHECKOUT_VISITOR', 'VISITORS', f"Checked out visitor {visitor.visitor_name}")
    return jsonify({'message': f"Visitor {visitor.visitor_name} checked out successfully", 'visitor': visitor.to_dict()}), 200
