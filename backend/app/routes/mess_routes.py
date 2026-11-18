from flask import Blueprint, request, jsonify
from datetime import datetime
from app.models import db, MessMenu, MessFeedback, MessInventory, Student
from app.utils.auth import get_current_user, warden_or_admin
from app.utils.audit import log_audit_trail
from flask_jwt_extended import jwt_required

mess_bp = Blueprint('mess', __name__, url_prefix='/api/mess')

@mess_bp.route('/menu', methods=['GET'])
@jwt_required()
def get_weekly_menu():
    menus = MessMenu.query.filter_by(is_active=True).all()
    # Group by day of week
    days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    organized = {day: {} for day in days}
    for m in menus:
        day = m.day_of_week.lower()
        if day in organized:
            organized[day][m.meal_type.lower()] = m.to_dict()

    return jsonify({
        'raw': [m.to_dict() for m in menus],
        'calendar': organized
    }), 200

@mess_bp.route('/menu', methods=['POST'])
@warden_or_admin
def update_menu_item():
    data = request.get_json() or {}
    day = data.get('day_of_week', '').lower()
    meal = data.get('meal_type', '').lower()
    items = data.get('items', '').strip()
    timing = data.get('timing')
    special_diet = data.get('special_diet')

    if not day or not meal or not items:
        return jsonify({'error': 'Day of week, meal type, and food items are required'}), 400

    menu_item = MessMenu.query.filter_by(day_of_week=day, meal_type=meal).first()
    if menu_item:
        menu_item.items = items
        menu_item.timing = timing or menu_item.timing
        menu_item.special_diet = special_diet
    else:
        menu_item = MessMenu(
            day_of_week=day,
            meal_type=meal,
            items=items,
            timing=timing,
            special_diet=special_diet,
            is_active=True
        )
        db.session.add(menu_item)

    db.session.commit()
    log_audit_trail('UPDATE_MESS_MENU', 'MESS', f"Updated {day} {meal} menu")
    return jsonify(menu_item.to_dict()), 200

@mess_bp.route('/feedback', methods=['GET'])
@jwt_required()
def get_feedback():
    feedbacks = MessFeedback.query.order_by(MessFeedback.id.desc()).limit(100).all()
    return jsonify([f.to_dict() for f in feedbacks]), 200

@mess_bp.route('/feedback', methods=['POST'])
@jwt_required()
def submit_feedback():
    user = get_current_user()
    data = request.get_json() or {}

    student_id = data.get('student_id')
    if user.role and user.role.name == 'student':
        if not user.student_profile:
            return jsonify({'error': 'Student profile not found'}), 400
        student_id = user.student_profile.id

    student = Student.query.get_or_404(student_id)

    feedback = MessFeedback(
        student_id=student.id,
        date=datetime.utcnow().date(),
        meal_type=data.get('meal_type', 'lunch'),
        rating=int(data.get('rating', 5)),
        hygiene_rating=int(data.get('hygiene_rating', 5)),
        quality_rating=int(data.get('quality_rating', 5)),
        comments=data.get('comments', '')
    )
    db.session.add(feedback)
    db.session.commit()

    return jsonify({'message': 'Thank you! Mess feedback received.', 'feedback': feedback.to_dict()}), 201

# ----------------- MESS INVENTORY -----------------
@mess_bp.route('/inventory', methods=['GET'])
@warden_or_admin
def get_inventory():
    items = MessInventory.query.order_by(MessInventory.item_name.asc()).all()
    return jsonify([i.to_dict() for i in items]), 200

@mess_bp.route('/inventory', methods=['POST'])
@warden_or_admin
def add_or_update_inventory():
    data = request.get_json() or {}
    item_id = data.get('id')
    name = data.get('item_name', '').strip()
    qty = float(data.get('quantity', 0.0))

    if not name:
        return jsonify({'error': 'Item name is required'}), 400

    if item_id:
        item = MessInventory.query.get_or_404(item_id)
        item.item_name = name
        item.category = data.get('category', item.category)
        item.quantity = qty
        item.unit = data.get('unit', item.unit)
        item.min_stock_threshold = float(data.get('min_stock_threshold', item.min_stock_threshold))
        item.unit_price = float(data.get('unit_price', item.unit_price))
        item.supplier_name = data.get('supplier_name', item.supplier_name)
        item.last_restocked_date = datetime.utcnow().date()
    else:
        item = MessInventory(
            item_name=name,
            category=data.get('category', 'grains'),
            quantity=qty,
            unit=data.get('unit', 'kg'),
            min_stock_threshold=float(data.get('min_stock_threshold', 10.0)),
            unit_price=float(data.get('unit_price', 0.0)),
            supplier_name=data.get('supplier_name'),
            last_restocked_date=datetime.utcnow().date()
        )
        db.session.add(item)

    db.session.commit()
    return jsonify(item.to_dict()), 200
