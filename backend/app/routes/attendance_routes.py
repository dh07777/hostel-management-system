from flask import Blueprint, request, jsonify
from datetime import datetime, date
from app.models import db, Attendance, Student, User
from app.utils.auth import get_current_user, warden_or_admin
from app.utils.audit import log_audit_trail
from flask_jwt_extended import jwt_required

attendance_bp = Blueprint('attendance', __name__, url_prefix='/api/attendance')

@attendance_bp.route('/', methods=['GET'])
@jwt_required()
def get_attendance():
    user = get_current_user()
    user_role = user.role.name if user.role else None

    date_str = request.args.get('date', datetime.utcnow().strftime('%Y-%m-%d'))
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except Exception:
        target_date = datetime.utcnow().date()

    if user_role == 'student':
        if not user.student_profile:
            return jsonify([]), 200
        records = Attendance.query.filter_by(student_id=user.student_profile.id).order_by(Attendance.date.desc()).all()
        return jsonify([r.to_dict() for r in records]), 200

    # For Wardens & Admins: list all active students with today's status
    students = Student.query.filter_by(status='active').order_by(Student.student_id_code.asc()).all()
    records_today = {a.student_id: a for a in Attendance.query.filter_by(date=target_date).all()}

    results = []
    for s in students:
        alloc = s.get_current_allocation()
        att = records_today.get(s.id)
        results.append({
            'student_id': s.id,
            'student_id_code': s.student_id_code,
            'student_name': s.full_name,
            'room_number': alloc.room.room_number if (alloc and alloc.room) else 'Not Assigned',
            'date': target_date.isoformat(),
            'status': att.status if att else 'unmarked',
            'remarks': att.remarks if att else '',
            'attendance_id': att.id if att else None
        })

    return jsonify(results), 200

@attendance_bp.route('/mark', methods=['POST'])
@warden_or_admin
def mark_attendance():
    user = get_current_user()
    data = request.get_json() or {}

    student_id = data.get('student_id')
    status = data.get('status', 'present') # present, absent, on_leave
    remarks = data.get('remarks', '')
    date_str = data.get('date', datetime.utcnow().strftime('%Y-%m-%d'))
    target_date = datetime.strptime(date_str, '%Y-%m-%d').date()

    record = Attendance.query.filter_by(student_id=student_id, date=target_date).first()
    if record:
        record.status = status
        record.remarks = remarks
        record.marked_by_id = user.id if user else None
    else:
        record = Attendance(
            student_id=student_id,
            date=target_date,
            status=status,
            marked_by_id=user.id if user else None,
            remarks=remarks
        )
        db.session.add(record)

    db.session.commit()
    return jsonify({'message': 'Attendance saved', 'record': record.to_dict()}), 200

@attendance_bp.route('/bulk-mark', methods=['POST'])
@warden_or_admin
def bulk_mark_attendance():
    user = get_current_user()
    data = request.get_json() or {}
    
    date_str = data.get('date', datetime.utcnow().strftime('%Y-%m-%d'))
    target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    records_data = data.get('records', []) # list of {student_id, status, remarks}

    if not records_data:
        return jsonify({'error': 'No records provided'}), 400

    count = 0
    for r in records_data:
        sid = r.get('student_id')
        stat = r.get('status', 'present')
        rem = r.get('remarks', '')
        
        att = Attendance.query.filter_by(student_id=sid, date=target_date).first()
        if att:
            att.status = stat
            att.remarks = rem
            att.marked_by_id = user.id if user else None
        else:
            att = Attendance(
                student_id=sid,
                date=target_date,
                status=stat,
                remarks=rem,
                marked_by_id=user.id if user else None
            )
            db.session.add(att)
        count += 1

    db.session.commit()
    log_audit_trail('BULK_ATTENDANCE', 'ATTENDANCE', f"Marked attendance for {count} students on {target_date}")

    return jsonify({'message': f"Successfully marked attendance for {count} students on {target_date}"}), 200

@attendance_bp.route('/student/<int:student_id>', methods=['GET'])
@jwt_required()
def get_student_attendance(student_id):
    records = Attendance.query.filter_by(student_id=student_id).order_by(Attendance.date.desc()).all()
    total = len(records)
    present = sum(1 for r in records if r.status == 'present')
    absent = sum(1 for r in records if r.status == 'absent')
    leave = sum(1 for r in records if r.status == 'on_leave')
    pct = round((present / total * 100), 1) if total > 0 else 100.0

    return jsonify({
        'total': total,
        'present': present,
        'absent': absent,
        'on_leave': leave,
        'percentage': pct,
        'records': [r.to_dict() for r in records]
    }), 200
