import uuid
from flask import Blueprint, request, jsonify, send_file
from datetime import datetime, timedelta
from app.models import db, FeeStructure, Invoice, Payment, Student
from app.utils.auth import get_current_user, accountant_or_admin
from app.utils.audit import log_audit_trail
from app.utils.pdf_generator import generate_invoice_pdf, generate_receipt_pdf
from flask_jwt_extended import jwt_required

fees_bp = Blueprint('fees', __name__, url_prefix='/api/fees')

# ----------------- FEE STRUCTURES -----------------
@fees_bp.route('/structures', methods=['GET'])
@jwt_required()
def get_fee_structures():
    structures = FeeStructure.query.filter_by(is_active=True).all()
    return jsonify([s.to_dict() for s in structures]), 200

@fees_bp.route('/structures', methods=['POST'])
@accountant_or_admin
def create_fee_structure():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    room_type = data.get('room_type', 'double')
    fee_type = data.get('fee_type', 'monthly')
    amount = float(data.get('amount', 0.0))

    if not name or amount <= 0:
        return jsonify({'error': 'Name and valid amount are required'}), 400

    fs = FeeStructure(
        name=name,
        room_type=room_type,
        fee_type=fee_type,
        amount=amount,
        late_penalty_per_day=float(data.get('late_penalty_per_day', 10.0)),
        description=data.get('description')
    )
    db.session.add(fs)
    db.session.commit()
    return jsonify(fs.to_dict()), 201

# ----------------- INVOICES -----------------
@fees_bp.route('/invoices', methods=['GET'])
@jwt_required()
def get_invoices():
    user = get_current_user()
    user_role = user.role.name if user.role else None

    status = request.args.get('status')
    student_id = request.args.get('student_id')

    # If student, restrict to their invoices
    if user_role == 'student':
        if not user.student_profile:
            return jsonify([]), 200
        student_id = user.student_profile.id

    query = Invoice.query
    if student_id:
        query = query.filter_by(student_id=student_id)
    if status:
        query = query.filter_by(status=status)

    invoices = query.order_by(Invoice.id.desc()).all()
    # Recalculate status for overdue if needed
    for inv in invoices:
        if inv.status in ['unpaid', 'partially_paid'] and inv.due_date and inv.due_date < datetime.utcnow().date():
            inv.status = 'overdue'

    return jsonify([inv.to_dict() for inv in invoices]), 200

@fees_bp.route('/invoices', methods=['POST'])
@accountant_or_admin
def create_invoice():
    data = request.get_json() or {}
    student_id = data.get('student_id')
    title = data.get('title', '').strip()
    fee_type = data.get('fee_type', 'monthly')
    amount = float(data.get('amount', 0.0))
    discount = float(data.get('discount_amount', 0.0))
    late_fee = float(data.get('late_fee', 0.0))
    due_date_str = data.get('due_date')

    if not student_id or not title or amount <= 0:
        return jsonify({'error': 'Student, title, and valid amount are required'}), 400

    student = Student.query.get_or_404(student_id)
    due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date() if due_date_str else (datetime.utcnow() + timedelta(days=15)).date()

    total_amount = max(0.0, amount + late_fee - discount)
    year = datetime.utcnow().year
    count = Invoice.query.count() + 1
    invoice_num = f"INV-{year}-{count:05d}"

    invoice = Invoice(
        invoice_number=invoice_num,
        student_id=student.id,
        title=title,
        fee_type=fee_type,
        amount=amount,
        discount_amount=discount,
        late_fee=late_fee,
        total_amount=total_amount,
        paid_amount=0.0,
        balance_amount=total_amount,
        status='unpaid',
        due_date=due_date,
        issued_date=datetime.utcnow().date(),
        billing_month=data.get('billing_month', datetime.utcnow().strftime('%B')),
        billing_year=int(data.get('billing_year', year)),
        notes=data.get('notes')
    )
    db.session.add(invoice)
    db.session.commit()

    log_audit_trail('CREATE_INVOICE', 'FEES', f"Created invoice {invoice_num} for Student {student.student_id_code} (${total_amount})")
    return jsonify(invoice.to_dict()), 201

@fees_bp.route('/invoices/<int:invoice_id>/pdf', methods=['GET'])
@jwt_required()
def download_invoice_pdf(invoice_id):
    invoice = Invoice.query.get_or_404(invoice_id)
    user = get_current_user()
    if user.role and user.role.name == 'student':
        if not user.student_profile or user.student_profile.id != invoice.student_id:
            return jsonify({'error': 'Unauthorized'}), 403

    pdf_buffer = generate_invoice_pdf(invoice)
    return send_file(
        pdf_buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"{invoice.invoice_number}.pdf"
    )

# ----------------- PAYMENTS & GATEWAY INTEGRATION -----------------
@fees_bp.route('/payments', methods=['GET'])
@jwt_required()
def get_payments():
    user = get_current_user()
    user_role = user.role.name if user.role else None

    student_id = request.args.get('student_id')
    if user_role == 'student':
        if not user.student_profile:
            return jsonify([]), 200
        student_id = user.student_profile.id

    query = Payment.query
    if student_id:
        query = query.filter_by(student_id=student_id)

    payments = query.order_by(Payment.payment_date.desc()).all()
    return jsonify([p.to_dict() for p in payments]), 200

@fees_bp.route('/payments', methods=['POST'])
@jwt_required()
def process_payment():
    user = get_current_user()
    data = request.get_json() or {}

    invoice_id = data.get('invoice_id')
    student_id = data.get('student_id')
    amount = float(data.get('amount', 0.0))
    payment_method = data.get('payment_method', 'online') # online, upi, card, net_banking, cash
    gateway = data.get('payment_gateway', 'mock_gateway') # mock_gateway test mode
    notes = data.get('notes', 'Payment completed via secure portal')

    if amount <= 0:
        return jsonify({'error': 'Payment amount must be greater than zero'}), 400

    invoice = None
    if invoice_id:
        invoice = Invoice.query.get_or_404(invoice_id)
        student_id = invoice.student_id

    student = Student.query.get_or_404(student_id)

    # Security rule: Never store card number or CVV!
    # Mock Gateway integration: generate secure transaction reference
    txn_ref = f"TXN-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
    pay_number = f"PAY-{datetime.utcnow().year}-{Payment.query.count() + 1:05d}"

    payment = Payment(
        payment_number=pay_number,
        invoice_id=invoice.id if invoice else None,
        student_id=student.id,
        amount=amount,
        payment_method=payment_method,
        transaction_reference=txn_ref,
        payment_gateway=gateway,
        gateway_response=f"SUCCESS: Captured by {gateway} (Test Mode Sandbox)",
        status='successful',
        payment_date=datetime.utcnow(),
        notes=notes,
        recorded_by_id=user.id if user else None
    )
    db.session.add(payment)
    db.session.flush()

    if invoice:
        invoice.update_balance()

    db.session.commit()
    log_audit_trail('PROCESS_PAYMENT', 'FEES', f"Payment {pay_number} of ${amount} for Student {student.student_id_code} (Txn: {txn_ref})")

    return jsonify({
        'message': f"Payment of ${amount:.2f} processed successfully!",
        'payment': payment.to_dict(),
        'invoice': invoice.to_dict() if invoice else None
    }), 201

@fees_bp.route('/payments/<int:payment_id>/pdf', methods=['GET'])
@jwt_required()
def download_payment_receipt_pdf(payment_id):
    payment = Payment.query.get_or_404(payment_id)
    user = get_current_user()
    if user.role and user.role.name == 'student':
        if not user.student_profile or user.student_profile.id != payment.student_id:
            return jsonify({'error': 'Unauthorized'}), 403

    pdf_buffer = generate_receipt_pdf(payment)
    return send_file(
        pdf_buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"{payment.payment_number}_receipt.pdf"
    )
