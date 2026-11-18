from flask import Blueprint, request, jsonify
from datetime import datetime
from app.models import db, Hostel, Building, Floor, Room, Bed, RoomAllocation, Student
from app.utils.auth import get_current_user, warden_or_admin, admin_required
from app.utils.audit import log_audit_trail
from flask_jwt_extended import jwt_required

rooms_bp = Blueprint('rooms', __name__, url_prefix='/api/rooms')

# ----------------- HOSTELS, BUILDINGS, FLOORS -----------------
@rooms_bp.route('/hostels', methods=['GET'])
@jwt_required()
def get_hostels():
    hostels = Hostel.query.all()
    return jsonify([h.to_dict() for h in hostels]), 200

@rooms_bp.route('/hostels', methods=['POST'])
@admin_required
def create_hostel():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    code = data.get('code', '').strip().upper()
    if not name or not code:
        return jsonify({'error': 'Hostel name and code are required'}), 400

    if Hostel.query.filter((Hostel.name == name) | (Hostel.code == code)).first():
        return jsonify({'error': 'Hostel name or code already exists'}), 400

    hostel = Hostel(
        name=name,
        code=code,
        campus=data.get('campus'),
        address=data.get('address'),
        phone=data.get('phone'),
        email=data.get('email'),
        total_capacity=int(data.get('total_capacity', 100))
    )
    db.session.add(hostel)
    db.session.commit()
    log_audit_trail('CREATE_HOSTEL', 'HOSTEL', f"Created hostel {hostel.name}")
    return jsonify(hostel.to_dict()), 201

@rooms_bp.route('/buildings', methods=['GET'])
@jwt_required()
def get_buildings():
    hostel_id = request.args.get('hostel_id')
    query = Building.query
    if hostel_id:
        query = query.filter_by(hostel_id=hostel_id)
    buildings = query.all()
    return jsonify([b.to_dict() for b in buildings]), 200

@rooms_bp.route('/buildings', methods=['POST'])
@admin_required
def create_building():
    data = request.get_json() or {}
    hostel_id = data.get('hostel_id')
    name = data.get('name', '').strip()
    code = data.get('code', '').strip().upper()
    total_floors = int(data.get('total_floors', 3))

    if not hostel_id or not name or not code:
        return jsonify({'error': 'Hostel ID, Building Name, and Code are required'}), 400

    building = Building(
        hostel_id=hostel_id,
        name=name,
        code=code,
        total_floors=total_floors,
        gender_type=data.get('gender_type', 'coed'),
        description=data.get('description')
    )
    db.session.add(building)
    db.session.flush()

    # Automatically create floors
    for f in range(total_floors):
        floor_name = "Ground Floor" if f == 0 else f"Floor {f}"
        floor = Floor(
            building_id=building.id,
            floor_number=f,
            floor_name=floor_name
        )
        db.session.add(floor)

    db.session.commit()
    log_audit_trail('CREATE_BUILDING', 'BUILDING', f"Created building {building.name} with {total_floors} floors")
    return jsonify(building.to_dict()), 201

@rooms_bp.route('/floors', methods=['GET'])
@jwt_required()
def get_floors():
    building_id = request.args.get('building_id')
    query = Floor.query
    if building_id:
        query = query.filter_by(building_id=building_id)
    floors = query.all()
    return jsonify([f.to_dict() for f in floors]), 200

# ----------------- ROOMS & BEDS -----------------
@rooms_bp.route('/', methods=['GET'])
@jwt_required()
def get_rooms():
    building_id = request.args.get('building_id')
    floor_id = request.args.get('floor_id')
    room_type = request.args.get('room_type')
    status = request.args.get('status')
    search = request.args.get('search', '').strip()

    query = Room.query
    if building_id:
        query = query.filter_by(building_id=building_id)
    if floor_id:
        query = query.filter_by(floor_id=floor_id)
    if room_type:
        query = query.filter_by(room_type=room_type)
    if search:
        query = query.filter(Room.room_number.ilike(f"%{search}%"))

    rooms = query.order_by(Room.room_number.asc()).all()
    result = [r.to_dict(include_beds=True) for r in rooms]

    if status:
        result = [r for r in result if r['status'] == status]

    return jsonify(result), 200

@rooms_bp.route('/<int:room_id>', methods=['GET'])
@jwt_required()
def get_room(room_id):
    room = Room.query.get_or_404(room_id)
    return jsonify(room.to_dict(include_beds=True)), 200

@rooms_bp.route('/', methods=['POST'])
@warden_or_admin
def create_room():
    data = request.get_json() or {}
    building_id = data.get('building_id')
    floor_id = data.get('floor_id')
    room_number = data.get('room_number', '').strip()
    room_type = data.get('room_type', 'double')
    
    # Capacity mapping
    cap_map = {'single': 1, 'double': 2, 'triple': 3, 'four_sharing': 4}
    capacity = int(data.get('capacity') or cap_map.get(room_type, 2))

    if not building_id or not floor_id or not room_number:
        return jsonify({'error': 'Building, floor, and room number are required'}), 400

    # Check duplicate room number in building
    if Room.query.filter_by(building_id=building_id, room_number=room_number).first():
        return jsonify({'error': f"Room {room_number} already exists in this building"}), 400

    room = Room(
        building_id=building_id,
        floor_id=floor_id,
        room_number=room_number,
        room_type=room_type,
        capacity=capacity,
        base_price_per_month=float(data.get('base_price_per_month', 150.0)),
        is_ac=bool(data.get('is_ac', False)),
        has_attached_bathroom=bool(data.get('has_attached_bathroom', True)),
        facilities=data.get('facilities', 'Study Table, Wardrobe, High-Speed Wi-Fi'),
        status='available'
    )
    db.session.add(room)
    db.session.flush()

    # Automatically generate beds: Bed A, Bed B, Bed C...
    for i in range(capacity):
        bed_letter = chr(65 + i) # A, B, C, D
        bed = Bed(
            room_id=room.id,
            bed_number=f"Bed-{bed_letter}",
            is_occupied=False,
            status='available'
        )
        db.session.add(bed)

    db.session.commit()
    log_audit_trail('CREATE_ROOM', 'ROOM', f"Created room {room.room_number} with {capacity} beds")

    return jsonify(room.to_dict(include_beds=True)), 201

@rooms_bp.route('/<int:room_id>', methods=['PUT'])
@warden_or_admin
def update_room(room_id):
    room = Room.query.get_or_404(room_id)
    data = request.get_json() or {}

    room.room_number = data.get('room_number', room.room_number)
    room.base_price_per_month = float(data.get('base_price_per_month', room.base_price_per_month))
    room.is_ac = bool(data.get('is_ac', room.is_ac))
    room.has_attached_bathroom = bool(data.get('has_attached_bathroom', room.has_attached_bathroom))
    room.facilities = data.get('facilities', room.facilities)
    if 'status' in data:
        room.status = data['status']

    db.session.commit()
    log_audit_trail('UPDATE_ROOM', 'ROOM', f"Updated room {room.room_number}")
    return jsonify(room.to_dict(include_beds=True)), 200

# ----------------- ROOM ALLOCATION WORKFLOW -----------------
@rooms_bp.route('/allocate', methods=['POST'])
@warden_or_admin
def allocate_room():
    user = get_current_user()
    data = request.get_json() or {}
    
    student_id = data.get('student_id')
    room_id = data.get('room_id')
    bed_id = data.get('bed_id')
    remarks = data.get('remarks', 'Standard room allocation')

    if not student_id or not room_id or not bed_id:
        return jsonify({'error': 'Student, room, and bed are required'}), 400

    student = Student.query.get_or_404(student_id)
    room = Room.query.get_or_404(room_id)
    bed = Bed.query.get_or_404(bed_id)

    # 1. Check duplicate active allocation for student
    current_alloc = student.get_current_allocation()
    if current_alloc:
        return jsonify({'error': f"Student {student.student_id_code} already has an active room allocation ({current_alloc.room.room_number}, {current_alloc.bed.bed_number}). Vacate or transfer first."}), 400

    # 2. Check bed availability
    if bed.is_occupied:
        return jsonify({'error': f"{bed.bed_number} in Room {room.room_number} is already occupied"}), 400

    # 3. Prevent capacity overflow
    occupied_count = sum(1 for b in room.beds if b.is_occupied)
    if occupied_count >= room.capacity:
        return jsonify({'error': f"Room {room.room_number} has reached maximum capacity ({room.capacity})"}), 400

    # Create allocation
    allocation = RoomAllocation(
        student_id=student.id,
        room_id=room.id,
        bed_id=bed.id,
        allocation_date=datetime.utcnow().date(),
        status='active',
        remarks=remarks,
        allocated_by_id=user.id if user else None
    )
    db.session.add(allocation)

    # Mark bed as occupied
    bed.is_occupied = True
    bed.status = 'occupied'

    # Update room status if full
    if occupied_count + 1 >= room.capacity:
        room.status = 'full'

    db.session.commit()
    log_audit_trail('ALLOCATE_ROOM', 'ROOM', f"Allocated Student {student.student_id_code} to Room {room.room_number} ({bed.bed_number})")

    return jsonify({
        'message': f"Student successfully allocated to Room {room.room_number} - {bed.bed_number}",
        'allocation': allocation.to_dict()
    }), 201

@rooms_bp.route('/vacate', methods=['POST'])
@warden_or_admin
def vacate_room():
    data = request.get_json() or {}
    student_id = data.get('student_id')
    remarks = data.get('remarks', 'Vacated room')

    if not student_id:
        return jsonify({'error': 'Student ID is required'}), 400

    student = Student.query.get_or_404(student_id)
    allocation = student.get_current_allocation()
    if not allocation:
        return jsonify({'error': 'Student does not have an active room allocation'}), 400

    allocation.status = 'vacated'
    allocation.vacating_date = datetime.utcnow().date()
    allocation.remarks = f"{allocation.remarks or ''} | Vacated: {remarks}".strip()

    # Free the bed
    if allocation.bed:
        allocation.bed.is_occupied = False
        allocation.bed.status = 'available'

    # Set room status back to available
    if allocation.room and allocation.room.status == 'full':
        allocation.room.status = 'available'

    db.session.commit()
    log_audit_trail('VACATE_ROOM', 'ROOM', f"Vacated Student {student.student_id_code} from Room {allocation.room.room_number}")

    return jsonify({'message': f"Room vacated successfully for Student {student.student_id_code}"}), 200

@rooms_bp.route('/transfer', methods=['POST'])
@warden_or_admin
def transfer_room():
    user = get_current_user()
    data = request.get_json() or {}
    
    student_id = data.get('student_id')
    new_room_id = data.get('new_room_id')
    new_bed_id = data.get('new_bed_id')
    reason = data.get('reason', 'Room transfer request approved')

    student = Student.query.get_or_404(student_id)
    current_alloc = student.get_current_allocation()
    if not current_alloc:
        return jsonify({'error': 'Student does not have an existing active room allocation'}), 400

    new_room = Room.query.get_or_404(new_room_id)
    new_bed = Bed.query.get_or_404(new_bed_id)

    if new_bed.is_occupied:
        return jsonify({'error': f"Target {new_bed.bed_number} is already occupied"}), 400

    # 1. Close old allocation
    current_alloc.status = 'transferred'
    current_alloc.vacating_date = datetime.utcnow().date()
    current_alloc.remarks = f"Transferred to Room {new_room.room_number}: {reason}"
    if current_alloc.bed:
        current_alloc.bed.is_occupied = False
        current_alloc.bed.status = 'available'
    if current_alloc.room and current_alloc.room.status == 'full':
        current_alloc.room.status = 'available'

    # 2. Open new allocation
    new_alloc = RoomAllocation(
        student_id=student.id,
        room_id=new_room.id,
        bed_id=new_bed.id,
        allocation_date=datetime.utcnow().date(),
        status='active',
        remarks=f"Transferred from Room {current_alloc.room.room_number}: {reason}",
        allocated_by_id=user.id if user else None
    )
    db.session.add(new_alloc)
    new_bed.is_occupied = True
    new_bed.status = 'occupied'

    # Check if new room now full
    occupied_count = sum(1 for b in new_room.beds if b.is_occupied)
    if occupied_count >= new_room.capacity:
        new_room.status = 'full'

    db.session.commit()
    log_audit_trail('TRANSFER_ROOM', 'ROOM', f"Transferred Student {student.student_id_code} from {current_alloc.room.room_number} to {new_room.room_number}")

    return jsonify({
        'message': f"Student transferred to Room {new_room.room_number} ({new_bed.bed_number}) successfully",
        'allocation': new_alloc.to_dict()
    }), 200

@rooms_bp.route('/allocations', methods=['GET'])
@jwt_required()
def get_allocations():
    allocations = RoomAllocation.query.order_by(RoomAllocation.id.desc()).limit(100).all()
    return jsonify([a.to_dict() for a in allocations]), 200
