from flask import Blueprint, request, jsonify
from datetime import datetime
from app.models import db, AdmissionApplication, Student, Parent, User, Role
from app.utils.auth import get_current_user, warden_or_admin, admin_required
from app.utils.audit import log_audit_trail
from flask_jwt_extended import jwt_required

admissions_bp = Blueprint('admissions', __name__, url_prefix='/api/admissions')

@admissions_bp.route('/', methods=['GET'])
@jwt_required()
def get_applications():
    status = request.args.get('status', '').strip()
    search = request.args.get('search', '').strip()
    
    query = AdmissionApplication.query
    if status:
        query = query.filter_by(status=status)
    if search:
        query = query.filter(
            (AdmissionApplication.first_name.ilike(f"%{search}%")) |
            (AdmissionApplication.last_name.ilike(f"%{search}%")) |
            (AdmissionApplication.email.ilike(f"%{search}%")) |
            (AdmissionApplication.application_number.ilike(f"%{search}%"))
        )

    apps = query.order_by(AdmissionApplication.id.desc()).all()
    return jsonify([a.to_dict() for a in apps]), 200

@admissions_bp.route('/track/<string:app_number>', methods=['GET'])
def track_application(app_number):
    app_record = AdmissionApplication.query.filter_by(application_number=app_number).first_or_404()
    return jsonify(app_record.to_dict()), 200

@admissions_bp.route('/', methods=['POST'])
def submit_application():
    data = request.get_json() or {}
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()

    if not first_name or not email or not phone:
        return jsonify({'error': 'First name, email, and phone are required'}), 400

    # Auto generate application number: APP20250001
    year = datetime.utcnow().year
    count = AdmissionApplication.query.count() + 1
    app_number = f"APP{year}{count:04d}"

    dob = None
    if data.get('date_of_birth'):
        try:
            dob = datetime.strptime(data.get('date_of_birth'), '%Y-%m-%d').date()
        except Exception:
            pass

    application = AdmissionApplication(
        application_number=app_number,
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
        academic_year=data.get('academic_year', '2025-2026'),
        preferred_room_type=data.get('preferred_room_type', 'double'),
        parent_name=data.get('parent_name'),
        parent_phone=data.get('parent_phone'),
        parent_email=data.get('parent_email'),
        emergency_contact=data.get('emergency_contact') or data.get('parent_phone'),
        document_url=data.get('document_url'),
        status='pending'
    )
    db.session.add(application)
    db.session.commit()

    log_audit_trail('SUBMIT_APPLICATION', 'ADMISSION', f"Submitted application {app_number} for {first_name} {last_name}")

    return jsonify({
        'message': 'Hostel admission application submitted successfully!',
        'application_number': app_number,
        'application': application.to_dict()
    }), 201

@admissions_bp.route('/<int:app_id>/approve', methods=['PUT'])
@warden_or_admin
def approve_application(app_id):
    current_admin = get_current_user()
    application = AdmissionApplication.query.get_or_404(app_id)
    data = request.get_json() or {}

    if application.status == 'approved':
        return jsonify({'error': 'Application has already been approved'}), 400

    application.status = 'approved'
    application.admin_remarks = data.get('admin_remarks', 'Application approved for hostel admission.')
    application.reviewed_by_id = current_admin.id if current_admin else None

    # Automatically create Student and User account if not exists
    existing_student = Student.query.filter_by(email=application.email).first()
    if not existing_student:
        year = datetime.utcnow().year
        student_count = Student.query.count() + 1
        student_code = f"STU{year}{student_count:04d}"

        student_role = Role.query.filter_by(name='student').first()
        default_pwd = 'Student@123'
        new_user = User(
            username=student_code.lower(),
            email=application.email,
            full_name=f"{application.first_name} {application.last_name}",
            phone=application.phone,
            role_id=student_role.id if student_role else 5,
            is_active=True
        )
        new_user.set_password(default_pwd)
        db.session.add(new_user)
        db.session.flush()

        new_student = Student(
            user_id=new_user.id,
            student_id_code=student_code,
            first_name=application.first_name,
            last_name=application.last_name,
            email=application.email,
            phone=application.phone,
            gender=application.gender,
            date_of_birth=application.date_of_birth,
            blood_group=application.blood_group,
            address=application.address,
            department=application.department,
            course=application.course,
            academic_year=application.academic_year,
            emergency_contact_name=application.parent_name,
            emergency_contact_phone=application.emergency_contact,
            emergency_contact_relation='Parent/Guardian',
            status='active'
        )
        db.session.add(new_student)
        db.session.flush()

        new_parent = Parent(
            student_id=new_student.id,
            father_name=application.parent_name,
            father_phone=application.parent_phone,
            guardian_name=application.parent_name,
            guardian_phone=application.parent_phone,
            residential_address=application.address
        )
        db.session.add(new_parent)

    db.session.commit()
    log_audit_trail('APPROVE_APPLICATION', 'ADMISSION', f"Approved application {application.application_number}")

    return jsonify({
        'message': f"Application {application.application_number} approved! Student account has been initialized.",
        'application': application.to_dict()
    }), 200

@admissions_bp.route('/<int:app_id>/reject', methods=['PUT'])
@warden_or_admin
def reject_application(app_id):
    current_admin = get_current_user()
    application = AdmissionApplication.query.get_or_404(app_id)
    data = request.get_json() or {}

    application.status = 'rejected'
    application.admin_remarks = data.get('admin_remarks', 'Application rejected based on capacity or eligibility.')
    application.reviewed_by_id = current_admin.id if current_admin else None

    db.session.commit()
    log_audit_trail('REJECT_APPLICATION', 'ADMISSION', f"Rejected application {application.application_number}")

    return jsonify({'message': f"Application {application.application_number} rejected", 'application': application.to_dict()}), 200

@admissions_bp.route('/<int:app_id>/waitlist', methods=['PUT'])
@warden_or_admin
def waitlist_application(app_id):
    application = AdmissionApplication.query.get_or_404(app_id)
    application.status = 'waitlisted'
    db.session.commit()
    return jsonify({'message': 'Application placed on waitlist', 'application': application.to_dict()}), 200
