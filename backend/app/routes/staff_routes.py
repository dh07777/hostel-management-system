from flask import Blueprint, request, jsonify
from datetime import datetime
from app.models import db, Staff, StaffAttendance, User, Role
from app.utils.auth import get_current_user, admin_required, warden_or_admin
from app.utils.audit import log_audit_trail
from flask_jwt_extended import jwt_required

staff_bp = Blueprint('staff', __name__, url_prefix='/api/staff')

@staff_bp.route('/', methods=['GET'])
@jwt_required()
def get_staff_list():
    designation = request.args.get('designation')
    status = request.args.get('status')

    query = Staff.query
    if designation:
        query = query.filter_by(designation=designation)
    if status:
        query = query.filter_by(status=status)

    staff_members = query.order_by(Staff.id.asc()).all()
    return jsonify([s.to_dict() for s in staff_members]), 200

@staff_bp.route('/', methods=['POST'])
@admin_required
def create_staff():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    designation = data.get('designation', 'staff').strip()

    if not name or not email or not phone:
        return jsonify({'error': 'Name, email, and phone are required'}), 400

    if Staff.query.filter((Staff.email == email) | (Staff.phone == phone)).first():
        return jsonify({'error': 'Staff with this email or phone already exists'}), 400

    count = Staff.query.count() + 1
    code = f"STF-{datetime.utcnow().year}-{count:03d}"

    # Map designation to system role if warden or accountant
    role_name = 'warden' if 'warden' in designation.lower() else ('accountant' if 'accountant' in designation.lower() else 'hostel_admin')
    role = Role.query.filter_by(name=role_name).first()
    
    # Create user login account for staff
    user = User(
        username=code.lower(),
        email=email,
        full_name=name,
        phone=phone,
        role_id=role.id if role else 2,
        is_active=True
    )
    user.set_password(data.get('password') or 'Staff@123')
    db.session.add(user)
    db.session.flush()

    joining_date = None
    if data.get('joining_date'):
        try:
            joining_date = datetime.strptime(data.get('joining_date'), '%Y-%m-%d').date()
        except Exception:
            pass

    staff = Staff(
        user_id=user.id,
        staff_code=code,
        name=name,
        email=email,
        phone=phone,
        designation=designation,
        department=data.get('department', 'Hostel Operations'),
        salary=float(data.get('salary', 0.0)),
        joining_date=joining_date or datetime.utcnow().date(),
        shift=data.get('shift', 'general'),
        emergency_contact=data.get('emergency_contact'),
        status='active'
    )
    db.session.add(staff)
    db.session.commit()

    log_audit_trail('CREATE_STAFF', 'STAFF', f"Created staff {code} ({name}, {designation})")

    return jsonify({
        'message': f"Staff member {name} created successfully",
        'staff': staff.to_dict(),
        'credentials': {
            'username': user.username,
            'default_password': data.get('password') or 'Staff@123'
        }
    }), 201

@staff_bp.route('/<int:staff_id>', methods=['PUT'])
@admin_required
def update_staff(staff_id):
    staff = Staff.query.get_or_404(staff_id)
    data = request.get_json() or {}

    staff.name = data.get('name', staff.name)
    staff.phone = data.get('phone', staff.phone)
    staff.designation = data.get('designation', staff.designation)
    staff.department = data.get('department', staff.department)
    staff.salary = float(data.get('salary', staff.salary))
    staff.shift = data.get('shift', staff.shift)
    staff.emergency_contact = data.get('emergency_contact', staff.emergency_contact)
    staff.status = data.get('status', staff.status)

    if staff.user:
        staff.user.full_name = staff.name
        staff.user.phone = staff.phone
        if staff.status in ['resigned', 'terminated']:
            staff.user.is_active = False

    db.session.commit()
    log_audit_trail('UPDATE_STAFF', 'STAFF', f"Updated staff {staff.staff_code}")
    return jsonify(staff.to_dict()), 200

@staff_bp.route('/<int:staff_id>', methods=['DELETE'])
@admin_required
def delete_staff(staff_id):
    staff = Staff.query.get_or_404(staff_id)
    staff.status = 'resigned'
    if staff.user:
        staff.user.is_active = False
    db.session.commit()
    return jsonify({'message': f"Staff member {staff.staff_code} deactivated"}), 200

# ----------------- STAFF ATTENDANCE -----------------
@staff_bp.route('/attendance', methods=['GET'])
@warden_or_admin
def get_staff_attendance():
    date_str = request.args.get('date', datetime.utcnow().strftime('%Y-%m-%d'))
    target_date = datetime.strptime(date_str, '%Y-%m-%d').date()

    all_staff = Staff.query.filter_by(status='active').all()
    records = {a.staff_id: a for a in StaffAttendance.query.filter_by(date=target_date).all()}

    results = []
    for s in all_staff:
        rec = records.get(s.id)
        results.append({
            'staff_id': s.id,
            'staff_code': s.staff_code,
            'name': s.name,
            'designation': s.designation,
            'status': rec.status if rec else 'unmarked',
            'check_in_time': rec.check_in_time if rec else None,
            'check_out_time': rec.check_out_time if rec else None,
            'remarks': rec.remarks if rec else ''
        })

    return jsonify(results), 200

@staff_bp.route('/attendance', methods=['POST'])
@warden_or_admin
def mark_staff_attendance():
    data = request.get_json() or {}
    staff_id = data.get('staff_id')
    date_str = data.get('date', datetime.utcnow().strftime('%Y-%m-%d'))
    target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    status = data.get('status', 'present')

    rec = StaffAttendance.query.filter_by(staff_id=staff_id, date=target_date).first()
    if rec:
        rec.status = status
        rec.check_in_time = data.get('check_in_time', rec.check_in_time)
        rec.check_out_time = data.get('check_out_time', rec.check_out_time)
        rec.remarks = data.get('remarks', rec.remarks)
    else:
        rec = StaffAttendance(
            staff_id=staff_id,
            date=target_date,
            status=status,
            check_in_time=data.get('check_in_time', '09:00 AM'),
            check_out_time=data.get('check_out_time'),
            remarks=data.get('remarks')
        )
        db.session.add(rec)

    db.session.commit()
    return jsonify(rec.to_dict()), 200
