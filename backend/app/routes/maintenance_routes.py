from flask import Blueprint, request, jsonify
from datetime import datetime
from app.models import db, MaintenanceRequest, Staff, Room, Expense
from app.utils.auth import get_current_user, warden_or_admin
from app.utils.audit import log_audit_trail
from flask_jwt_extended import jwt_required

maintenance_bp = Blueprint('maintenance', __name__, url_prefix='/api/maintenance')

@maintenance_bp.route('/', methods=['GET'])
@jwt_required()
def get_maintenance_requests():
    status = request.args.get('status')
    priority = request.args.get('priority')
    category = request.args.get('category')

    query = MaintenanceRequest.query
    if status:
        query = query.filter_by(status=status)
    if priority:
        query = query.filter_by(priority=priority)
    if category:
        query = query.filter_by(category=category)

    requests = query.order_by(MaintenanceRequest.id.desc()).all()
    return jsonify([r.to_dict() for r in requests]), 200

@maintenance_bp.route('/', methods=['POST'])
@warden_or_admin
def create_maintenance_request():
    user = get_current_user()
    data = request.get_json() or {}

    title = data.get('title', '').strip()
    category = data.get('category', 'general')
    priority = data.get('priority', 'medium')
    description = data.get('description', '').strip()

    if not title or not description:
        return jsonify({'error': 'Title and description are required'}), 400

    sched_date = None
    if data.get('scheduled_date'):
        try:
            sched_date = datetime.strptime(data.get('scheduled_date'), '%Y-%m-%d').date()
        except Exception:
            pass

    year = datetime.utcnow().year
    code = f"MNT-{year}-{MaintenanceRequest.query.count() + 1:04d}"

    m_request = MaintenanceRequest(
        request_code=code,
        title=title,
        category=category,
        priority=priority,
        description=description,
        location_details=data.get('location_details'),
        room_id=data.get('room_id'),
        assigned_to_staff_id=data.get('assigned_to_staff_id'),
        scheduled_date=sched_date,
        estimated_cost=float(data.get('estimated_cost', 0.0)),
        actual_cost=0.0,
        status='pending',
        created_by_id=user.id if user else None
    )
    db.session.add(m_request)
    db.session.commit()

    log_audit_trail('CREATE_MAINTENANCE', 'MAINTENANCE', f"Created maintenance request {code}")
    return jsonify(m_request.to_dict()), 201

@maintenance_bp.route('/<int:req_id>', methods=['PUT'])
@warden_or_admin
def update_maintenance_request(req_id):
    m_request = MaintenanceRequest.query.get_or_404(req_id)
    data = request.get_json() or {}

    m_request.status = data.get('status', m_request.status)
    m_request.assigned_to_staff_id = data.get('assigned_to_staff_id', m_request.assigned_to_staff_id)
    m_request.estimated_cost = float(data.get('estimated_cost', m_request.estimated_cost))
    m_request.actual_cost = float(data.get('actual_cost', m_request.actual_cost))
    m_request.completion_notes = data.get('completion_notes', m_request.completion_notes)

    if data.get('scheduled_date'):
        try:
            m_request.scheduled_date = datetime.strptime(data.get('scheduled_date'), '%Y-%m-%d').date()
        except Exception:
            pass

    # If completed and actual cost > 0, automatically log an expense record
    if m_request.status == 'completed' and m_request.actual_cost > 0:
        existing_exp = Expense.query.filter_by(invoice_reference=m_request.request_code).first()
        if not existing_exp:
            exp_code = f"EXP-{datetime.utcnow().year}-{Expense.query.count() + 1:05d}"
            expense = Expense(
                expense_code=exp_code,
                title=f"Maintenance: {m_request.title}",
                category='repairs',
                amount=m_request.actual_cost,
                payment_method='bank_transfer',
                invoice_reference=m_request.request_code,
                expense_date=datetime.utcnow().date(),
                paid_to='Maintenance Contractor / Vendor',
                notes=m_request.completion_notes
            )
            db.session.add(expense)

    db.session.commit()
    log_audit_trail('UPDATE_MAINTENANCE', 'MAINTENANCE', f"Updated maintenance request {m_request.request_code} to {m_request.status}")

    return jsonify(m_request.to_dict()), 200
