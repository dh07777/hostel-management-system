from flask import Blueprint, request, jsonify
from datetime import datetime
from app.models import db, Setting, AuditLog, Expense
from app.utils.auth import admin_required, get_current_user
from app.utils.audit import log_audit_trail
from flask_jwt_extended import jwt_required

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@settings_bp.route('/', methods=['GET'])
@jwt_required()
def get_settings():
    settings = Setting.query.all()
    data = {s.key: s.value for s in settings}
    return jsonify(data), 200

@settings_bp.route('/', methods=['PUT'])
@admin_required
def update_settings():
    data = request.get_json() or {}
    for key, value in data.items():
        setting = Setting.query.filter_by(key=key).first()
        if setting:
            setting.value = str(value)
        else:
            setting = Setting(key=key, value=str(value), description=f"System setting {key}")
            db.session.add(setting)

    db.session.commit()
    log_audit_trail('UPDATE_SETTINGS', 'SETTINGS', f"Updated system configuration")
    return jsonify({'message': 'Settings updated successfully'}), 200

# ----------------- AUDIT LOGS -----------------
@settings_bp.route('/audit-logs', methods=['GET'])
@admin_required
def get_audit_logs():
    module = request.args.get('module')
    action = request.args.get('action')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 25))

    query = AuditLog.query
    if module:
        query = query.filter_by(module=module)
    if action:
        query = query.filter_by(action=action)

    logs_paginated = query.order_by(AuditLog.id.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'logs': [l.to_dict() for l in logs_paginated.items],
        'total': logs_paginated.total,
        'pages': logs_paginated.pages,
        'current_page': page
    }), 200

# ----------------- EXPENSES -----------------
@settings_bp.route('/expenses', methods=['GET'])
@jwt_required()
def get_expenses():
    category = request.args.get('category')
    query = Expense.query
    if category:
        query = query.filter_by(category=category)

    expenses = query.order_by(Expense.expense_date.desc()).all()
    return jsonify([e.to_dict() for e in expenses]), 200

@settings_bp.route('/expenses', methods=['POST'])
@jwt_required()
def create_expense():
    user = get_current_user()
    data = request.get_json() or {}

    title = data.get('title', '').strip()
    category = data.get('category', 'miscellaneous')
    amount = float(data.get('amount', 0.0))
    paid_to = data.get('paid_to', '').strip()

    if not title or amount <= 0:
        return jsonify({'error': 'Title and valid amount are required'}), 400

    exp_date = None
    if data.get('expense_date'):
        try:
            exp_date = datetime.strptime(data.get('expense_date'), '%Y-%m-%d').date()
        except Exception:
            pass

    code = f"EXP-{datetime.utcnow().year}-{Expense.query.count() + 1:05d}"
    expense = Expense(
        expense_code=code,
        title=title,
        category=category,
        amount=amount,
        payment_method=data.get('payment_method', 'bank_transfer'),
        invoice_reference=data.get('invoice_reference'),
        expense_date=exp_date or datetime.utcnow().date(),
        paid_to=paid_to,
        approved_by_id=user.id if user else None,
        notes=data.get('notes')
    )
    db.session.add(expense)
    db.session.commit()

    log_audit_trail('CREATE_EXPENSE', 'EXPENSES', f"Created expense {code} (${amount})")
    return jsonify(expense.to_dict()), 201
