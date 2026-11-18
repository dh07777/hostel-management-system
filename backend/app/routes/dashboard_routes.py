from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from sqlalchemy import func
from app.models import (
    db, Student, Room, Bed, RoomAllocation, Payment, Invoice,
    Expense, MaintenanceRequest, Visitor, Attendance, Complaint,
    AdmissionApplication, Announcement
)
from app.utils.auth import get_current_user, warden_or_admin
from flask_jwt_extended import jwt_required

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    user = get_current_user()
    
    # 1. Students Count
    total_students = Student.query.filter_by(status='active').count()
    
    # 2. Rooms & Capacity
    total_rooms = Room.query.count()
    total_beds = Bed.query.count()
    occupied_beds = Bed.query.filter_by(is_occupied=True).count()
    available_beds = max(0, total_beds - occupied_beds)
    
    # Room occupancy stats
    occupied_rooms = Room.query.filter(Room.beds.any(Bed.is_occupied == True)).count()
    available_rooms = max(0, total_rooms - occupied_rooms)
    occupancy_pct = round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0.0

    # 3. Financials
    now = datetime.utcnow()
    first_day_curr_month = datetime(now.year, now.month, 1)
    
    monthly_revenue = db.session.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
        Payment.status == 'successful',
        Payment.payment_date >= first_day_curr_month
    ).scalar()

    pending_payments = db.session.query(func.coalesce(func.sum(Invoice.balance_amount), 0.0)).filter(
        Invoice.status.in_(['unpaid', 'partially_paid', 'overdue'])
    ).scalar()

    total_expenses = db.session.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(
        Expense.expense_date >= first_day_curr_month.date()
    ).scalar()

    # 4. Operations
    active_maintenance = MaintenanceRequest.query.filter(MaintenanceRequest.status.in_(['pending', 'scheduled', 'in_progress'])).count()
    current_visitors = Visitor.query.filter_by(status='checked_in').count()
    pending_admissions = AdmissionApplication.query.filter_by(status='pending').count()
    open_complaints = Complaint.query.filter(Complaint.status.in_(['submitted', 'under_review', 'assigned', 'in_progress'])).count()

    return jsonify({
        'total_students': total_students,
        'total_rooms': total_rooms,
        'total_capacity': total_beds,
        'occupied_beds': occupied_beds,
        'available_beds': available_beds,
        'occupied_rooms': occupied_rooms,
        'available_rooms': available_rooms,
        'occupancy_percentage': occupancy_pct,
        'monthly_revenue': round(monthly_revenue, 2),
        'pending_payments': round(pending_payments, 2),
        'total_expenses': round(total_expenses, 2),
        'maintenance_requests': active_maintenance,
        'current_visitors': current_visitors,
        'pending_admissions': pending_admissions,
        'open_complaints': open_complaints
    }), 200

@dashboard_bp.route('/charts', methods=['GET'])
@jwt_required()
def get_chart_data():
    now = datetime.utcnow()
    
    # 1. Last 6 Months Revenue vs Expenses
    monthly_data = []
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    for i in range(5, -1, -1):
        target_date = now - timedelta(days=i * 30)
        y, m = target_date.year, target_date.month
        month_label = f"{month_names[m - 1]} {y}"
        
        start_date = datetime(y, m, 1)
        end_date = datetime(y, m + 1, 1) if m < 12 else datetime(y + 1, 1, 1)
        
        rev = db.session.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
            Payment.status == 'successful',
            Payment.payment_date >= start_date,
            Payment.payment_date < end_date
        ).scalar()
        
        exp = db.session.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(
            Expense.expense_date >= start_date.date(),
            Expense.expense_date < end_date.date()
        ).scalar()
        
        monthly_data.append({
            'month': month_label,
            'revenue': round(rev, 2),
            'expenses': round(exp, 2)
        })

    # 2. Room Types Distribution
    room_types_query = db.session.query(
        Room.room_type,
        func.count(Room.id)
    ).group_by(Room.room_type).all()
    room_types_data = [{'type': r[0].replace('_', ' ').capitalize(), 'count': r[1]} for r in room_types_query]

    # 3. Payment Status Distribution
    payment_statuses = db.session.query(
        Invoice.status,
        func.count(Invoice.id)
    ).group_by(Invoice.status).all()
    payment_data = [{'status': s[0].replace('_', ' ').capitalize(), 'count': s[1]} for s in payment_statuses]

    # 4. Maintenance by Priority
    maintenance_query = db.session.query(
        MaintenanceRequest.priority,
        func.count(MaintenanceRequest.id)
    ).group_by(MaintenanceRequest.priority).all()
    maintenance_data = [{'priority': m[0].capitalize(), 'count': m[1]} for m in maintenance_query]

    # 5. Complaints by Category
    complaints_query = db.session.query(
        Complaint.category,
        func.count(Complaint.id)
    ).group_by(Complaint.category).all()
    complaints_data = [{'category': c[0].replace('_', ' ').title(), 'count': c[1]} for c in complaints_query]

    return jsonify({
        'monthly_revenue_chart': monthly_data,
        'room_types_chart': room_types_data,
        'payment_status_chart': payment_data,
        'maintenance_priority_chart': maintenance_data,
        'complaints_category_chart': complaints_data
    }), 200

@dashboard_bp.route('/recent-activities', methods=['GET'])
@jwt_required()
def get_recent_activities():
    # 5 recent admissions
    recent_admissions = AdmissionApplication.query.order_by(AdmissionApplication.created_at.desc()).limit(5).all()
    # 5 recent payments
    recent_payments = Payment.query.order_by(Payment.payment_date.desc()).limit(5).all()
    # 5 recent complaints
    recent_complaints = Complaint.query.order_by(Complaint.created_at.desc()).limit(5).all()
    # 5 recent announcements
    announcements = Announcement.query.order_by(Announcement.created_at.desc()).limit(5).all()

    return jsonify({
        'recent_admissions': [a.to_dict() for a in recent_admissions],
        'recent_payments': [p.to_dict() for p in recent_payments],
        'recent_complaints': [c.to_dict() for c in recent_complaints],
        'announcements': [ann.to_dict() for ann in announcements]
    }), 200

@dashboard_bp.route('/warden-summary', methods=['GET'])
@warden_or_admin
def get_warden_summary():
    today = datetime.utcnow().date()
    total_residents = Student.query.filter_by(status='active').count()
    present_today = Attendance.query.filter_by(date=today, status='present').count()
    absent_today = Attendance.query.filter_by(date=today, status='absent').count()
    leave_today = Attendance.query.filter_by(date=today, status='on_leave').count()
    
    pending_leaves = db.session.query(func.count(db.text('1'))).select_from(
        db.text('leave_applications')
    ).filter(db.text("status = 'pending'")).scalar()
    
    current_visitors = Visitor.query.filter_by(status='checked_in').count()
    unresolved_complaints = Complaint.query.filter(Complaint.status.in_(['submitted', 'under_review', 'assigned', 'in_progress'])).count()

    return jsonify({
        'total_residents': total_residents,
        'present_today': present_today,
        'absent_today': absent_today,
        'leave_today': leave_today,
        'pending_leaves': pending_leaves,
        'current_visitors': current_visitors,
        'unresolved_complaints': unresolved_complaints
    }), 200
