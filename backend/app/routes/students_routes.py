import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from datetime import datetime
from app.models import db, Student, Parent, RoomAllocation, Invoice, Payment, Attendance, Complaint, LeaveApplication, Visitor, User, Role
from app.utils.auth import get_current_user, role_required, admin_required, warden_or_admin
from app.utils.audit import log_audit_trail
from flask_jwt_extended import jwt_required

students_bp = Blueprint('students', __name__, url_prefix='/api/students')

@students_bp.route('/', methods=['GET'])
@jwt_required()
def get_students():
    user = get_current_user()
    user_role = user.role.name if user.role else None

    # If student, redirect / limit to their own record
    if user_role == 'student':
        if not user.student_profile:
            return jsonify({'students': [], 'total': 0}), 200
        return jsonify({
            'students': [user.student_profile.to_dict(full_details=True)],
            'total': 1,
            'pages': 1,
            'current_page': 1
        }), 200

    # Query filters
    search = request.args.get('search', '').strip()
    department = request.args.get('department', '').strip()
    status = request.args.get('status', '').strip()
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 15))

    query = Student.query

    if search:
        query = query.filter(
            (Student.first_name.ilike(f"%{search}%")) |
            (Student.last_name.ilike(f"%{search}%")) |
            (Student.student_id_code.ilike(f"%{search}%")) |
            (Student.email.ilike(f"%{search}%")) |
            (Student.phone.ilike(f"%{search}%"))
        )

    if department:
        query = query.filter(Student.department == department)

    if status:
        query = query.filter(Student.status == status)

    total = query.count()
    students_paginated = query.order_by(Student.id.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'students': [s.to_dict() for s in students_paginated.items],
        'total': total,
        'pages': students_paginated.pages,
        'current_page': page
    }), 200

@students_bp.route('/<int:student_id>', methods=['GET'])
@jwt_required()
def get_student_detail(student_id):
    user = get_current_user()
    user_role = user.role.name if user.role else None

    # Security check: Students can only view their own profile
    if user_role == 'student':
        if not user.student_profile or user.student_profile.id != student_id:
            return jsonify({'error': 'Unauthorized: You can only view your own profile'}), 403

    student = Student.query.get_or_404(student_id)
    student_data = student.to_dict(full_details=True)

    # 1. Room Allocation History
    allocations = RoomAllocation.query.filter_by(student_id=student.id).order_by(RoomAllocation.id.desc()).all()
    student_data['allocation_history'] = [a.to_dict() for a in allocations]

    # 2. Invoices & Payment History
    invoices = Invoice.query.filter_by(student_id=student.id).order_by(Invoice.id.desc()).all()
    payments = Payment.query.filter_by(student_id=student.id).order_by(Payment.payment_date.desc()).all()
    student_data['invoices'] = [i.to_dict() for i in invoices]
    student_data['payments'] = [p.to_dict() for p in payments]

    # 3. Attendance Summary & History
    total_attendance = Attendance.query.filter_by(student_id=student.id).count()
    present_days = Attendance.query.filter_by(student_id=student.id, status='present').count()
    attendance_pct = round((present_days / total_attendance * 100), 1) if total_attendance > 0 else 100.0
    recent_attendance = Attendance.query.filter_by(student_id=student.id).order_by(Attendance.date.desc()).limit(30).all()
    
    student_data['attendance_summary'] = {
        'total_marked': total_attendance,
        'present_days': present_days,
        'percentage': attendance_pct,
        'recent_records': [a.to_dict() for a in recent_attendance]
    }

    # 4. Complaints
    complaints = Complaint.query.filter_by(student_id=student.id).order_by(Complaint.created_at.desc()).all()
    student_data['complaints'] = [c.to_dict() for c in complaints]

    # 5. Leaves
    leaves = LeaveApplication.query.filter_by(student_id=student.id).order_by(LeaveApplication.created_at.desc()).all()
    student_data['leaves'] = [l.to_dict() for l in leaves]

    # 6. Visitors
    visitors = Visitor.query.filter_by(student_id=student.id).order_by(Visitor.check_in_time.desc()).all()
    student_data['visitors'] = [v.to_dict() for v in visitors]

    return jsonify(student_data), 200

@students_bp.route('/', methods=['POST'])
@warden_or_admin
def create_student():
    data = request.get_json() or {}
    
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()

    if not first_name or not email or not phone:
        return jsonify({'error': 'First name, email, and phone are required'}), 400

    if Student.query.filter_by(email=email).first():
        return jsonify({'error': 'A student with this email already exists'}), 400

    # Auto generate Student ID Code (e.g. STU20250001)
    year = datetime.utcnow().year
    count_today = Student.query.count() + 1
    student_code = f"STU{year}{count_today:04d}"

    # Parse date of birth
    dob = None
    if data.get('date_of_birth'):
        try:
            dob = datetime.strptime(data.get('date_of_birth'), '%Y-%m-%d').date()
        except Exception:
            pass

    # Create User account for student
    student_role = Role.query.filter_by(name='student').first()
    default_password = data.get('password') or 'Student@123'
    
    user = User(
        username=student_code.lower(),
        email=email,
        full_name=f"{first_name} {last_name}",
        phone=phone,
        role_id=student_role.id if student_role else 5,
        is_active=True
    )
    user.set_password(default_password)
    db.session.add(user)
    db.session.flush()

    student = Student(
        user_id=user.id,
        student_id_code=student_code,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        gender=data.get('gender', 'male'),
        date_of_birth=dob,
        blood_group=data.get('blood_group'),
        address=data.get('address'),
        department=data.get('department'),
        course=data.get('course'),
        academic_year=data.get('academic_year'),
        emergency_contact_name=data.get('emergency_contact_name'),
        emergency_contact_phone=data.get('emergency_contact_phone'),
        emergency_contact_relation=data.get('emergency_contact_relation'),
        status=data.get('status', 'active')
    )
    db.session.add(student)
    db.session.flush()

    # Parent record
    parent = Parent(
        student_id=student.id,
        father_name=data.get('father_name'),
        father_phone=data.get('father_phone'),
        father_occupation=data.get('father_occupation'),
        mother_name=data.get('mother_name'),
        mother_phone=data.get('mother_phone'),
        mother_occupation=data.get('mother_occupation'),
        guardian_name=data.get('guardian_name'),
        guardian_phone=data.get('guardian_phone'),
        guardian_relation=data.get('guardian_relation'),
        residential_address=data.get('parent_address') or data.get('address')
    )
    db.session.add(parent)
    db.session.commit()

    log_audit_trail('CREATE_STUDENT', 'STUDENT', f"Created student {student.student_id_code} ({student.full_name})")

    return jsonify({
        'message': 'Student created successfully with auto-generated credentials',
        'student': student.to_dict(full_details=True),
        'credentials': {
            'username': user.username,
            'default_password': default_password
        }
    }), 201

@students_bp.route('/<int:student_id>', methods=['PUT'])
@warden_or_admin
def update_student(student_id):
    student = Student.query.get_or_404(student_id)
    data = request.get_json() or {}

    student.first_name = data.get('first_name', student.first_name)
    student.last_name = data.get('last_name', student.last_name)
    student.phone = data.get('phone', student.phone)
    student.gender = data.get('gender', student.gender)
    student.blood_group = data.get('blood_group', student.blood_group)
    student.address = data.get('address', student.address)
    student.department = data.get('department', student.department)
    student.course = data.get('course', student.course)
    student.academic_year = data.get('academic_year', student.academic_year)
    student.emergency_contact_name = data.get('emergency_contact_name', student.emergency_contact_name)
    student.emergency_contact_phone = data.get('emergency_contact_phone', student.emergency_contact_phone)
    student.emergency_contact_relation = data.get('emergency_contact_relation', student.emergency_contact_relation)
    student.status = data.get('status', student.status)

    if data.get('date_of_birth'):
        try:
            student.date_of_birth = datetime.strptime(data.get('date_of_birth'), '%Y-%m-%d').date()
        except Exception:
            pass

    # Update Parent info
    if student.parent_info:
        p = student.parent_info
        p.father_name = data.get('father_name', p.father_name)
        p.father_phone = data.get('father_phone', p.father_phone)
        p.father_occupation = data.get('father_occupation', p.father_occupation)
        p.mother_name = data.get('mother_name', p.mother_name)
        p.mother_phone = data.get('mother_phone', p.mother_phone)
        p.guardian_name = data.get('guardian_name', p.guardian_name)
        p.guardian_phone = data.get('guardian_phone', p.guardian_phone)
        p.residential_address = data.get('residential_address', p.residential_address)

    db.session.commit()
    log_audit_trail('UPDATE_STUDENT', 'STUDENT', f"Updated student {student.student_id_code}")

    return jsonify({'message': 'Student record updated successfully', 'student': student.to_dict(full_details=True)}), 200

@students_bp.route('/<int:student_id>', methods=['DELETE'])
@admin_required
def delete_student(student_id):
    student = Student.query.get_or_404(student_id)
    # Deactivate student instead of hard cascade delete
    student.status = 'inactive'
    if student.user:
        student.user.is_active = False

    # Vacate active room if any
    alloc = student.get_current_allocation()
    if alloc:
        alloc.status = 'vacated'
        alloc.vacating_date = datetime.utcnow().date()
        if alloc.bed:
            alloc.bed.is_occupied = False
            alloc.bed.status = 'available'

    db.session.commit()
    log_audit_trail('DEACTIVATE_STUDENT', 'STUDENT', f"Deactivated student {student.student_id_code}")

    return jsonify({'message': f"Student {student.student_id_code} deactivated successfully"}), 200

@students_bp.route('/<int:student_id>/upload-photo', methods=['POST'])
@jwt_required()
def upload_photo(student_id):
    student = Student.query.get_or_404(student_id)
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filename = secure_filename(f"student_{student.id}_{int(datetime.utcnow().timestamp())}_{file.filename}")
    upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
    file.save(upload_path)

    student.photo_url = f"/uploads/{filename}"
    if student.user:
        student.user.avatar_url = student.photo_url
    db.session.commit()

    return jsonify({'message': 'Photo uploaded successfully', 'photo_url': student.photo_url}), 200
