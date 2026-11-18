from flask import Blueprint, request, jsonify, send_file, Response
from datetime import datetime
from app.models import (
    db, Student, Room, Bed, Payment, Invoice, Expense, Attendance,
    Complaint, MaintenanceRequest, Visitor, LeaveApplication, MessInventory
)
from app.utils.auth import warden_or_admin, accountant_or_admin
from app.utils.export_helpers import export_to_csv, export_to_excel
from flask_jwt_extended import jwt_required

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@reports_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_reports_summary():
    """
    Returns aggregated metrics and lists for the reporting dashboard.
    """
    total_students = Student.query.count()
    active_students = Student.query.filter_by(status='active').count()
    total_rooms = Room.query.count()
    total_beds = Bed.query.count()
    occupied_beds = Bed.query.filter_by(is_occupied=True).count()
    
    total_revenue = db.session.query(db.func.coalesce(db.func.sum(Payment.amount), 0.0)).filter_by(status='successful').scalar()
    total_outstanding = db.session.query(db.func.coalesce(db.func.sum(Invoice.balance_amount), 0.0)).scalar()
    total_expenses = db.session.query(db.func.coalesce(db.func.sum(Expense.amount), 0.0)).scalar()

    total_complaints = Complaint.query.count()
    resolved_complaints = Complaint.query.filter_by(status='resolved').count()
    total_maintenance = MaintenanceRequest.query.count()
    total_visitors = Visitor.query.count()
    total_leaves = LeaveApplication.query.count()

    return jsonify({
        'total_students': total_students,
        'active_students': active_students,
        'total_rooms': total_rooms,
        'total_beds': total_beds,
        'occupied_beds': occupied_beds,
        'available_beds': max(0, total_beds - occupied_beds),
        'occupancy_rate': round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0,
        'total_revenue': round(total_revenue, 2),
        'total_outstanding': round(total_outstanding, 2),
        'total_expenses': round(total_expenses, 2),
        'total_complaints': total_complaints,
        'resolved_complaints': resolved_complaints,
        'total_maintenance': total_maintenance,
        'total_visitors': total_visitors,
        'total_leaves': total_leaves
    }), 200

@reports_bp.route('/export', methods=['GET'])
@jwt_required()
def export_report():
    report_type = request.args.get('type', 'students').lower()
    export_format = request.args.get('format', 'csv').lower() # csv, excel

    headers = []
    rows = []
    filename = f"{report_type}_report_{datetime.utcnow().strftime('%Y%m%d')}"

    if report_type == 'students':
        headers = ['Student ID', 'Full Name', 'Email', 'Phone', 'Gender', 'Department', 'Course', 'Room', 'Status']
        students = Student.query.all()
        for s in students:
            alloc = s.get_current_allocation()
            room_str = alloc.room.room_number if (alloc and alloc.room) else 'N/A'
            rows.append([s.student_id_code, s.full_name, s.email, s.phone, s.gender, s.department or '', s.course or '', room_str, s.status])

    elif report_type == 'occupancy':
        headers = ['Room Number', 'Type', 'Capacity', 'Occupied Beds', 'Available Beds', 'AC', 'Attached Bath', 'Monthly Fee ($)', 'Status']
        rooms = Room.query.all()
        for r in rooms:
            occ = sum(1 for b in r.beds if b.is_occupied)
            rows.append([r.room_number, r.room_type, r.capacity, occ, max(0, r.capacity - occ), 'Yes' if r.is_ac else 'No', 'Yes' if r.has_attached_bathroom else 'No', f"${r.base_price_per_month:.2f}", r.status])

    elif report_type == 'payments':
        headers = ['Payment #', 'Student ID', 'Student Name', 'Amount ($)', 'Payment Method', 'Transaction Ref', 'Gateway', 'Date', 'Status']
        payments = Payment.query.all()
        for p in payments:
            rows.append([p.payment_number, p.student.student_id_code if p.student else '', p.student.full_name if p.student else '', f"${p.amount:.2f}", p.payment_method, p.transaction_reference, p.payment_gateway, p.payment_date.strftime('%Y-%m-%d %H:%M') if p.payment_date else '', p.status])

    elif report_type == 'invoices':
        headers = ['Invoice #', 'Student ID', 'Student Name', 'Title', 'Fee Type', 'Total ($)', 'Paid ($)', 'Balance ($)', 'Due Date', 'Status']
        invoices = Invoice.query.all()
        for i in invoices:
            rows.append([i.invoice_number, i.student.student_id_code if i.student else '', i.student.full_name if i.student else '', i.title, i.fee_type, f"${i.total_amount:.2f}", f"${i.paid_amount:.2f}", f"${i.balance_amount:.2f}", i.due_date.isoformat() if i.due_date else '', i.status])

    elif report_type == 'expenses':
        headers = ['Expense Code', 'Title', 'Category', 'Amount ($)', 'Method', 'Paid To', 'Date', 'Ref']
        expenses = Expense.query.all()
        for e in expenses:
            rows.append([e.expense_code, e.title, e.category, f"${e.amount:.2f}", e.payment_method, e.paid_to or '', e.expense_date.isoformat() if e.expense_date else '', e.invoice_reference or ''])

    elif report_type == 'attendance':
        headers = ['Date', 'Student ID', 'Student Name', 'Status', 'Remarks']
        records = Attendance.query.order_by(Attendance.date.desc()).limit(500).all()
        for a in records:
            rows.append([a.date.isoformat() if a.date else '', a.student.student_id_code if a.student else '', a.student.full_name if a.student else '', a.status, a.remarks or ''])

    elif report_type == 'complaints':
        headers = ['Complaint Code', 'Student ID', 'Category', 'Title', 'Priority', 'Assigned Staff', 'Status', 'Date']
        complaints = Complaint.query.all()
        for c in complaints:
            rows.append([c.complaint_code, c.student.student_id_code if c.student else '', c.category, c.title, c.priority, c.assigned_staff.name if c.assigned_staff else 'Unassigned', c.status, c.created_at.strftime('%Y-%m-%d') if c.created_at else ''])

    elif report_type == 'visitors':
        headers = ['Visitor Name', 'Phone', 'Student Visited', 'Purpose', 'Check-In', 'Check-Out', 'Status']
        visitors = Visitor.query.all()
        for v in visitors:
            rows.append([v.visitor_name, v.phone, v.student.full_name if v.student else '', v.purpose, v.check_in_time.strftime('%Y-%m-%d %H:%M') if v.check_in_time else '', v.check_out_time.strftime('%Y-%m-%d %H:%M') if v.check_out_time else '-', v.status])

    elif report_type == 'leaves':
        headers = ['Leave Code', 'Student ID', 'Student Name', 'Type', 'From', 'To', 'Parent Phone', 'Status']
        leaves = LeaveApplication.query.all()
        for l in leaves:
            rows.append([l.leave_code, l.student.student_id_code if l.student else '', l.student.full_name if l.student else '', l.leave_type, l.from_date.isoformat() if l.from_date else '', l.to_date.isoformat() if l.to_date else '', l.parent_phone, l.status])

    else:
        return jsonify({'error': f"Unknown report type: {report_type}"}), 400

    if export_format == 'excel':
        excel_buffer = export_to_excel(report_type.capitalize(), headers, rows)
        return send_file(
            excel_buffer,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f"{filename}.xlsx"
        )
    else:
        csv_file = export_to_csv(headers, rows)
        return Response(
            csv_file.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename={filename}.csv'}
        )
