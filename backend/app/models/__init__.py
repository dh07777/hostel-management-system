from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

# -------------------------------------------------------------
# 1. ROLES & USERS
# -------------------------------------------------------------
class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False, index=True) # super_admin, hostel_admin, warden, accountant, student
    display_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    users = db.relationship('User', backref='role', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'description': self.description
        }

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(25))
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    avatar_url = db.Column(db.String(255))
    last_login_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student_profile = db.relationship('Student', backref='user', uselist=False, lazy=True)
    staff_profile = db.relationship('Staff', backref='user', uselist=False, lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_profile=True):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'phone': self.phone,
            'role_id': self.role_id,
            'role': self.role.name if self.role else None,
            'role_display': self.role.display_name if self.role else None,
            'is_active': self.is_active,
            'avatar_url': self.avatar_url,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_profile:
            if self.student_profile:
                data['student_id'] = self.student_profile.id
                data['student_id_code'] = self.student_profile.student_id_code
            if self.staff_profile:
                data['staff_id'] = self.staff_profile.id
                data['staff_code'] = self.staff_profile.staff_code
        return data

# -------------------------------------------------------------
# 2. HOSTEL, BUILDINGS, FLOORS, ROOMS, BEDS, ALLOCATIONS
# -------------------------------------------------------------
class Hostel(db.Model):
    __tablename__ = 'hostels'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    code = db.Column(db.String(30), unique=True, nullable=False)
    campus = db.Column(db.String(100))
    address = db.Column(db.String(255))
    phone = db.Column(db.String(30))
    email = db.Column(db.String(120))
    total_capacity = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='active') # active, inactive
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    buildings = db.relationship('Building', backref='hostel', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'campus': self.campus,
            'address': self.address,
            'phone': self.phone,
            'email': self.email,
            'total_capacity': self.total_capacity,
            'status': self.status,
            'building_count': len(self.buildings)
        }

class Building(db.Model):
    __tablename__ = 'buildings'
    id = db.Column(db.Integer, primary_key=True)
    hostel_id = db.Column(db.Integer, db.ForeignKey('hostels.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(30), nullable=False)
    total_floors = db.Column(db.Integer, default=1)
    gender_type = db.Column(db.String(20), default='coed') # male, female, coed
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    floors = db.relationship('Floor', backref='building', lazy=True, cascade='all, delete-orphan')
    rooms = db.relationship('Room', backref='building', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'hostel_id': self.hostel_id,
            'hostel_name': self.hostel.name if self.hostel else None,
            'name': self.name,
            'code': self.code,
            'total_floors': self.total_floors,
            'gender_type': self.gender_type,
            'description': self.description,
            'room_count': len(self.rooms)
        }

class Floor(db.Model):
    __tablename__ = 'floors'
    id = db.Column(db.Integer, primary_key=True)
    building_id = db.Column(db.Integer, db.ForeignKey('buildings.id'), nullable=False)
    floor_number = db.Column(db.Integer, nullable=False)
    floor_name = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    rooms = db.relationship('Room', backref='floor', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'building_id': self.building_id,
            'building_name': self.building.name if self.building else None,
            'floor_number': self.floor_number,
            'floor_name': self.floor_name,
            'room_count': len(self.rooms)
        }

class Room(db.Model):
    __tablename__ = 'rooms'
    id = db.Column(db.Integer, primary_key=True)
    building_id = db.Column(db.Integer, db.ForeignKey('buildings.id'), nullable=False)
    floor_id = db.Column(db.Integer, db.ForeignKey('floors.id'), nullable=False)
    room_number = db.Column(db.String(30), nullable=False, index=True)
    room_type = db.Column(db.String(30), default='double') # single, double, triple, four_sharing
    capacity = db.Column(db.Integer, nullable=False, default=2)
    base_price_per_month = db.Column(db.Float, default=0.0)
    is_ac = db.Column(db.Boolean, default=False)
    has_attached_bathroom = db.Column(db.Boolean, default=True)
    facilities = db.Column(db.Text) # Wi-Fi, Balcony, Study Table, Wardrobe
    status = db.Column(db.String(30), default='available') # available, full, maintenance, reserved
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    beds = db.relationship('Bed', backref='room', lazy=True, cascade='all, delete-orphan')
    allocations = db.relationship('RoomAllocation', backref='room', lazy=True)

    def to_dict(self, include_beds=True):
        occupied_beds = sum(1 for b in self.beds if b.is_occupied)
        available_beds = max(0, self.capacity - occupied_beds)
        calc_status = 'full' if occupied_beds >= self.capacity else ('available' if self.status != 'maintenance' else self.status)
        
        data = {
            'id': self.id,
            'building_id': self.building_id,
            'building_name': self.building.name if self.building else None,
            'hostel_id': self.building.hostel_id if self.building else None,
            'hostel_name': self.building.hostel.name if (self.building and self.building.hostel) else None,
            'floor_id': self.floor_id,
            'floor_name': self.floor.floor_name if self.floor else None,
            'room_number': self.room_number,
            'room_type': self.room_type,
            'capacity': self.capacity,
            'occupied_beds': occupied_beds,
            'available_beds': available_beds,
            'base_price_per_month': self.base_price_per_month,
            'is_ac': self.is_ac,
            'has_attached_bathroom': self.has_attached_bathroom,
            'facilities': self.facilities,
            'status': calc_status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_beds:
            data['beds'] = [b.to_dict() for b in self.beds]
        return data

class Bed(db.Model):
    __tablename__ = 'beds'
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=False)
    bed_number = db.Column(db.String(20), nullable=False) # e.g. Bed A, Bed B
    is_occupied = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='available') # available, occupied, maintenance
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    allocations = db.relationship('RoomAllocation', backref='bed', lazy=True)

    def to_dict(self):
        active_alloc = next((a for a in self.allocations if a.status == 'active'), None)
        return {
            'id': self.id,
            'room_id': self.room_id,
            'bed_number': self.bed_number,
            'is_occupied': self.is_occupied,
            'status': self.status,
            'student_name': (active_alloc.student.first_name + " " + active_alloc.student.last_name) if active_alloc and active_alloc.student else None,
            'student_id': active_alloc.student_id if active_alloc else None,
            'student_id_code': active_alloc.student.student_id_code if active_alloc and active_alloc.student else None
        }

class RoomAllocation(db.Model):
    __tablename__ = 'room_allocations'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=False)
    bed_id = db.Column(db.Integer, db.ForeignKey('beds.id'), nullable=False)
    allocation_date = db.Column(db.Date, default=datetime.utcnow().date, nullable=False)
    vacating_date = db.Column(db.Date)
    status = db.Column(db.String(20), default='active') # active, vacated, transferred
    remarks = db.Column(db.String(255))
    allocated_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    allocated_by = db.relationship('User', foreign_keys=[allocated_by_id])

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': (self.student.first_name + " " + self.student.last_name) if self.student else None,
            'student_id_code': self.student.student_id_code if self.student else None,
            'room_id': self.room_id,
            'room_number': self.room.room_number if self.room else None,
            'building_name': self.room.building.name if (self.room and self.room.building) else None,
            'bed_id': self.bed_id,
            'bed_number': self.bed.bed_number if self.bed else None,
            'allocation_date': self.allocation_date.isoformat() if self.allocation_date else None,
            'vacating_date': self.vacating_date.isoformat() if self.vacating_date else None,
            'status': self.status,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# -------------------------------------------------------------
# 3. STUDENTS & PARENTS
# -------------------------------------------------------------
class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=True)
    student_id_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(30), nullable=False)
    gender = db.Column(db.String(20), default='male') # male, female, other
    date_of_birth = db.Column(db.Date)
    blood_group = db.Column(db.String(10))
    address = db.Column(db.String(255))
    department = db.Column(db.String(100))
    course = db.Column(db.String(100))
    academic_year = db.Column(db.String(30))
    admission_date = db.Column(db.Date, default=datetime.utcnow().date)
    joining_date = db.Column(db.Date, default=datetime.utcnow().date)
    photo_url = db.Column(db.String(255))
    document_url = db.Column(db.String(255))
    emergency_contact_name = db.Column(db.String(100))
    emergency_contact_phone = db.Column(db.String(30))
    emergency_contact_relation = db.Column(db.String(50))
    status = db.Column(db.String(30), default='active') # active, inactive, suspended, graduated
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    parent_info = db.relationship('Parent', backref='student', uselist=False, lazy=True, cascade='all, delete-orphan')
    allocations = db.relationship('RoomAllocation', backref='student', lazy=True)
    invoices = db.relationship('Invoice', backref='student', lazy=True)
    payments = db.relationship('Payment', backref='student', lazy=True)
    attendances = db.relationship('Attendance', backref='student', lazy=True)
    complaints = db.relationship('Complaint', backref='student', lazy=True)
    leaves = db.relationship('LeaveApplication', backref='student', lazy=True)
    visitors = db.relationship('Visitor', backref='student', lazy=True)
    mess_feedbacks = db.relationship('MessFeedback', backref='student', lazy=True)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def get_current_allocation(self):
        return next((a for a in self.allocations if a.status == 'active'), None)

    def to_dict(self, full_details=False):
        current_alloc = self.get_current_allocation()
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'student_id_code': self.student_id_code,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'gender': self.gender,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'blood_group': self.blood_group,
            'address': self.address,
            'department': self.department,
            'course': self.course,
            'academic_year': self.academic_year,
            'admission_date': self.admission_date.isoformat() if self.admission_date else None,
            'joining_date': self.joining_date.isoformat() if self.joining_date else None,
            'photo_url': self.photo_url,
            'document_url': self.document_url,
            'emergency_contact_name': self.emergency_contact_name,
            'emergency_contact_phone': self.emergency_contact_phone,
            'emergency_contact_relation': self.emergency_contact_relation,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            # Current room details
            'current_room_id': current_alloc.room_id if current_alloc else None,
            'current_room_number': current_alloc.room.room_number if (current_alloc and current_alloc.room) else None,
            'current_bed_id': current_alloc.bed_id if current_alloc else None,
            'current_bed_number': current_alloc.bed.bed_number if (current_alloc and current_alloc.bed) else None,
            'building_name': current_alloc.room.building.name if (current_alloc and current_alloc.room and current_alloc.room.building) else None,
            'hostel_name': current_alloc.room.building.hostel.name if (current_alloc and current_alloc.room and current_alloc.room.building and current_alloc.room.building.hostel) else None
        }
        if full_details:
            data['parent_info'] = self.parent_info.to_dict() if self.parent_info else None
        return data

class Parent(db.Model):
    __tablename__ = 'parents'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False, unique=True)
    father_name = db.Column(db.String(100))
    father_phone = db.Column(db.String(30))
    father_occupation = db.Column(db.String(100))
    mother_name = db.Column(db.String(100))
    mother_phone = db.Column(db.String(30))
    mother_occupation = db.Column(db.String(100))
    guardian_name = db.Column(db.String(100))
    guardian_phone = db.Column(db.String(30))
    guardian_relation = db.Column(db.String(50))
    residential_address = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'father_name': self.father_name,
            'father_phone': self.father_phone,
            'father_occupation': self.father_occupation,
            'mother_name': self.mother_name,
            'mother_phone': self.mother_phone,
            'mother_occupation': self.mother_occupation,
            'guardian_name': self.guardian_name,
            'guardian_phone': self.guardian_phone,
            'guardian_relation': self.guardian_relation,
            'residential_address': self.residential_address
        }

# -------------------------------------------------------------
# 4. ADMISSION APPLICATIONS
# -------------------------------------------------------------
class AdmissionApplication(db.Model):
    __tablename__ = 'admission_applications'
    id = db.Column(db.Integer, primary_key=True)
    application_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), nullable=False, index=True)
    phone = db.Column(db.String(30), nullable=False)
    gender = db.Column(db.String(20), default='male')
    date_of_birth = db.Column(db.Date)
    blood_group = db.Column(db.String(10))
    address = db.Column(db.String(255))
    department = db.Column(db.String(100))
    course = db.Column(db.String(100))
    academic_year = db.Column(db.String(30))
    preferred_room_type = db.Column(db.String(30), default='double')
    parent_name = db.Column(db.String(100))
    parent_phone = db.Column(db.String(30))
    parent_email = db.Column(db.String(120))
    emergency_contact = db.Column(db.String(100))
    document_url = db.Column(db.String(255))
    status = db.Column(db.String(30), default='pending') # pending, approved, rejected, waitlisted
    admin_remarks = db.Column(db.Text)
    reviewed_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reviewed_by = db.relationship('User', foreign_keys=[reviewed_by_id])

    def to_dict(self):
        return {
            'id': self.id,
            'application_number': self.application_number,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': f"{self.first_name} {self.last_name}",
            'email': self.email,
            'phone': self.phone,
            'gender': self.gender,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'blood_group': self.blood_group,
            'address': self.address,
            'department': self.department,
            'course': self.course,
            'academic_year': self.academic_year,
            'preferred_room_type': self.preferred_room_type,
            'parent_name': self.parent_name,
            'parent_phone': self.parent_phone,
            'parent_email': self.parent_email,
            'emergency_contact': self.emergency_contact,
            'document_url': self.document_url,
            'status': self.status,
            'admin_remarks': self.admin_remarks,
            'reviewed_by': self.reviewed_by.full_name if self.reviewed_by else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# -------------------------------------------------------------
# 5. FEES, INVOICES & PAYMENTS
# -------------------------------------------------------------
class FeeStructure(db.Model):
    __tablename__ = 'fee_structures'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    hostel_id = db.Column(db.Integer, db.ForeignKey('hostels.id'), nullable=True)
    room_type = db.Column(db.String(30), nullable=False) # single, double, triple, four_sharing
    fee_type = db.Column(db.String(50), nullable=False) # monthly, semester, annual, mess, security_deposit, electricity, other
    amount = db.Column(db.Float, nullable=False, default=0.0)
    late_penalty_per_day = db.Column(db.Float, default=10.0)
    description = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'hostel_id': self.hostel_id,
            'room_type': self.room_type,
            'fee_type': self.fee_type,
            'amount': self.amount,
            'late_penalty_per_day': self.late_penalty_per_day,
            'description': self.description,
            'is_active': self.is_active
        }

class Invoice(db.Model):
    __tablename__ = 'invoices'
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    fee_type = db.Column(db.String(50), default='monthly') # monthly, semester, annual, mess, etc.
    amount = db.Column(db.Float, nullable=False, default=0.0)
    discount_amount = db.Column(db.Float, default=0.0)
    late_fee = db.Column(db.Float, default=0.0)
    total_amount = db.Column(db.Float, nullable=False, default=0.0)
    paid_amount = db.Column(db.Float, default=0.0)
    balance_amount = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(30), default='unpaid') # unpaid, partially_paid, paid, overdue, cancelled
    due_date = db.Column(db.Date, nullable=False)
    issued_date = db.Column(db.Date, default=datetime.utcnow().date)
    billing_month = db.Column(db.String(20))
    billing_year = db.Column(db.Integer)
    notes = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    payments = db.relationship('Payment', backref='invoice', lazy=True, cascade='all, delete-orphan')

    def update_balance(self):
        self.paid_amount = sum(p.amount for p in self.payments if p.status == 'successful')
        self.balance_amount = max(0.0, self.total_amount - self.paid_amount)
        if self.paid_amount >= self.total_amount:
            self.status = 'paid'
        elif self.paid_amount > 0:
            self.status = 'partially_paid'
        elif self.due_date and self.due_date < datetime.utcnow().date():
            self.status = 'overdue'
        else:
            self.status = 'unpaid'

    def to_dict(self):
        return {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'student_id': self.student_id,
            'student_name': self.student.full_name if self.student else None,
            'student_id_code': self.student.student_id_code if self.student else None,
            'title': self.title,
            'fee_type': self.fee_type,
            'amount': self.amount,
            'discount_amount': self.discount_amount,
            'late_fee': self.late_fee,
            'total_amount': self.total_amount,
            'paid_amount': self.paid_amount,
            'balance_amount': self.balance_amount,
            'status': self.status,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'issued_date': self.issued_date.isoformat() if self.issued_date else None,
            'billing_month': self.billing_month,
            'billing_year': self.billing_year,
            'notes': self.notes,
            'payments_count': len(self.payments),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Payment(db.Model):
    __tablename__ = 'payments'
    id = db.Column(db.Integer, primary_key=True)
    payment_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'), nullable=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False, default=0.0)
    payment_method = db.Column(db.String(50), default='online') # online, upi, card, net_banking, cash, cheque
    transaction_reference = db.Column(db.String(100), unique=True, nullable=False)
    payment_gateway = db.Column(db.String(50), default='mock_gateway')
    gateway_response = db.Column(db.Text)
    status = db.Column(db.String(30), default='successful') # successful, pending, failed, refunded
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)
    receipt_url = db.Column(db.String(255))
    notes = db.Column(db.String(255))
    recorded_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    recorded_by = db.relationship('User', foreign_keys=[recorded_by_id])

    def to_dict(self):
        return {
            'id': self.id,
            'payment_number': self.payment_number,
            'invoice_id': self.invoice_id,
            'invoice_number': self.invoice.invoice_number if self.invoice else None,
            'student_id': self.student_id,
            'student_name': self.student.full_name if self.student else None,
            'student_id_code': self.student.student_id_code if self.student else None,
            'amount': self.amount,
            'payment_method': self.payment_method,
            'transaction_reference': self.transaction_reference,
            'payment_gateway': self.payment_gateway,
            'status': self.status,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'receipt_url': self.receipt_url,
            'notes': self.notes,
            'recorded_by': self.recorded_by.full_name if self.recorded_by else 'Self Service'
        }

# -------------------------------------------------------------
# 6. ATTENDANCE
# -------------------------------------------------------------
class Attendance(db.Model):
    __tablename__ = 'attendance'
    __table_args__ = (db.UniqueConstraint('student_id', 'date', name='uq_student_date_attendance'),)

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False, default='present') # present, absent, on_leave
    marked_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    remarks = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    marked_by = db.relationship('User', foreign_keys=[marked_by_id])

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': self.student.full_name if self.student else None,
            'student_id_code': self.student.student_id_code if self.student else None,
            'date': self.date.isoformat() if self.date else None,
            'status': self.status,
            'marked_by': self.marked_by.full_name if self.marked_by else 'Automated',
            'remarks': self.remarks
        }

# -------------------------------------------------------------
# 7. COMPLAINTS & UPDATES
# -------------------------------------------------------------
class Complaint(db.Model):
    __tablename__ = 'complaints'
    id = db.Column(db.Integer, primary_key=True)
    complaint_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    category = db.Column(db.String(50), nullable=False) # electricity, water_supply, room_cleaning, internet, furniture, plumbing, food_quality, security, other
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default='medium') # low, medium, high, urgent
    status = db.Column(db.String(30), default='submitted') # submitted, under_review, assigned, in_progress, resolved, rejected
    image_url = db.Column(db.String(255))
    assigned_to_staff_id = db.Column(db.Integer, db.ForeignKey('staff.id'), nullable=True)
    resolution_notes = db.Column(db.Text)
    resolved_at = db.Column(db.DateTime)
    feedback_rating = db.Column(db.Integer) # 1 - 5
    feedback_comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assigned_staff = db.relationship('Staff', foreign_keys=[assigned_to_staff_id])
    updates = db.relationship('ComplaintUpdate', backref='complaint', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_updates=True):
        data = {
            'id': self.id,
            'complaint_code': self.complaint_code,
            'student_id': self.student_id,
            'student_name': self.student.full_name if self.student else None,
            'student_id_code': self.student.student_id_code if self.student else None,
            'room_number': self.student.get_current_allocation().room.room_number if (self.student and self.student.get_current_allocation() and self.student.get_current_allocation().room) else None,
            'category': self.category,
            'title': self.title,
            'description': self.description,
            'priority': self.priority,
            'status': self.status,
            'image_url': self.image_url,
            'assigned_to_staff_id': self.assigned_to_staff_id,
            'assigned_staff_name': self.assigned_staff.name if self.assigned_staff else None,
            'resolution_notes': self.resolution_notes,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'feedback_rating': self.feedback_rating,
            'feedback_comment': self.feedback_comment,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_updates:
            data['updates'] = [u.to_dict() for u in self.updates]
        return data

class ComplaintUpdate(db.Model):
    __tablename__ = 'complaint_updates'
    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    old_status = db.Column(db.String(30))
    new_status = db.Column(db.String(30), nullable=False)
    comment = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'old_status': self.old_status,
            'new_status': self.new_status,
            'comment': self.comment,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# -------------------------------------------------------------
# 8. MAINTENANCE REQUESTS
# -------------------------------------------------------------
class MaintenanceRequest(db.Model):
    __tablename__ = 'maintenance_requests'
    id = db.Column(db.Integer, primary_key=True)
    request_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), nullable=False) # electrical, plumbing, carpentry, painting, cleaning, appliance, other
    priority = db.Column(db.String(20), default='medium') # low, medium, high, urgent
    description = db.Column(db.Text, nullable=False)
    location_details = db.Column(db.String(150))
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=True)
    assigned_to_staff_id = db.Column(db.Integer, db.ForeignKey('staff.id'), nullable=True)
    scheduled_date = db.Column(db.Date)
    estimated_cost = db.Column(db.Float, default=0.0)
    actual_cost = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(30), default='pending') # pending, scheduled, in_progress, completed, cancelled
    completion_notes = db.Column(db.Text)
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    room = db.relationship('Room', foreign_keys=[room_id])
    assigned_staff = db.relationship('Staff', foreign_keys=[assigned_to_staff_id])
    created_by = db.relationship('User', foreign_keys=[created_by_id])

    def to_dict(self):
        return {
            'id': self.id,
            'request_code': self.request_code,
            'title': self.title,
            'category': self.category,
            'priority': self.priority,
            'description': self.description,
            'location_details': self.location_details,
            'room_id': self.room_id,
            'room_number': self.room.room_number if self.room else None,
            'assigned_to_staff_id': self.assigned_to_staff_id,
            'assigned_staff_name': self.assigned_staff.name if self.assigned_staff else None,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'estimated_cost': self.estimated_cost,
            'actual_cost': self.actual_cost,
            'status': self.status,
            'completion_notes': self.completion_notes,
            'created_by': self.created_by.full_name if self.created_by else 'Admin',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# -------------------------------------------------------------
# 9. VISITORS
# -------------------------------------------------------------
class Visitor(db.Model):
    __tablename__ = 'visitors'
    id = db.Column(db.Integer, primary_key=True)
    visitor_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(30), nullable=False)
    id_proof_type = db.Column(db.String(50), default='National ID') # National ID, Driver License, Passport, etc.
    id_proof_number = db.Column(db.String(50))
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    purpose = db.Column(db.String(150), nullable=False)
    check_in_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    check_out_time = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='checked_in') # checked_in, checked_out, rejected
    approved_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    vehicle_number = db.Column(db.String(30))
    remarks = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    approved_by = db.relationship('User', foreign_keys=[approved_by_id])

    def to_dict(self):
        return {
            'id': self.id,
            'visitor_name': self.visitor_name,
            'phone': self.phone,
            'id_proof_type': self.id_proof_type,
            'id_proof_number': self.id_proof_number,
            'student_id': self.student_id,
            'student_name': self.student.full_name if self.student else None,
            'student_id_code': self.student.student_id_code if self.student else None,
            'room_number': self.student.get_current_allocation().room.room_number if (self.student and self.student.get_current_allocation() and self.student.get_current_allocation().room) else None,
            'purpose': self.purpose,
            'check_in_time': self.check_in_time.isoformat() if self.check_in_time else None,
            'check_out_time': self.check_out_time.isoformat() if self.check_out_time else None,
            'status': self.status,
            'approved_by': self.approved_by.full_name if self.approved_by else None,
            'vehicle_number': self.vehicle_number,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# -------------------------------------------------------------
# 10. LEAVE APPLICATIONS
# -------------------------------------------------------------
class LeaveApplication(db.Model):
    __tablename__ = 'leave_applications'
    id = db.Column(db.Integer, primary_key=True)
    leave_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    leave_type = db.Column(db.String(30), default='home') # home, vacation, medical, academic, emergency
    from_date = db.Column(db.Date, nullable=False)
    to_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    parent_phone = db.Column(db.String(30), nullable=False)
    parent_consent = db.Column(db.Boolean, default=True)
    status = db.Column(db.String(30), default='pending') # pending, approved, rejected, completed
    approved_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    approval_remarks = db.Column(db.Text)
    actual_return_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    approved_by = db.relationship('User', foreign_keys=[approved_by_id])

    def to_dict(self):
        return {
            'id': self.id,
            'leave_code': self.leave_code,
            'student_id': self.student_id,
            'student_name': self.student.full_name if self.student else None,
            'student_id_code': self.student.student_id_code if self.student else None,
            'room_number': self.student.get_current_allocation().room.room_number if (self.student and self.student.get_current_allocation() and self.student.get_current_allocation().room) else None,
            'leave_type': self.leave_type,
            'from_date': self.from_date.isoformat() if self.from_date else None,
            'to_date': self.to_date.isoformat() if self.to_date else None,
            'reason': self.reason,
            'parent_phone': self.parent_phone,
            'parent_consent': self.parent_consent,
            'status': self.status,
            'approved_by': self.approved_by.full_name if self.approved_by else None,
            'approval_remarks': self.approval_remarks,
            'actual_return_date': self.actual_return_date.isoformat() if self.actual_return_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# -------------------------------------------------------------
# 11. MESS MANAGEMENT (MENU, FEEDBACK, INVENTORY)
# -------------------------------------------------------------
class MessMenu(db.Model):
    __tablename__ = 'mess_menus'
    id = db.Column(db.Integer, primary_key=True)
    day_of_week = db.Column(db.String(20), nullable=False) # monday, tuesday, wednesday, etc.
    meal_type = db.Column(db.String(20), nullable=False) # breakfast, lunch, snacks, dinner
    items = db.Column(db.Text, nullable=False)
    special_diet = db.Column(db.String(255))
    timing = db.Column(db.String(50)) # e.g. "07:30 AM - 09:30 AM"
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'day_of_week': self.day_of_week,
            'meal_type': self.meal_type,
            'items': self.items,
            'special_diet': self.special_diet,
            'timing': self.timing,
            'is_active': self.is_active
        }

class MessFeedback(db.Model):
    __tablename__ = 'mess_feedback'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    date = db.Column(db.Date, default=datetime.utcnow().date, nullable=False)
    meal_type = db.Column(db.String(20), nullable=False) # breakfast, lunch, snacks, dinner
    rating = db.Column(db.Integer, nullable=False) # 1 - 5
    hygiene_rating = db.Column(db.Integer, default=5)
    quality_rating = db.Column(db.Integer, default=5)
    comments = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': self.student.full_name if self.student else None,
            'date': self.date.isoformat() if self.date else None,
            'meal_type': self.meal_type,
            'rating': self.rating,
            'hygiene_rating': self.hygiene_rating,
            'quality_rating': self.quality_rating,
            'comments': self.comments,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class MessInventory(db.Model):
    __tablename__ = 'mess_inventory'
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), default='grains') # grains, vegetables, dairy, spices, beverages, cleaning, other
    quantity = db.Column(db.Float, default=0.0)
    unit = db.Column(db.String(20), default='kg') # kg, liters, packets, units
    min_stock_threshold = db.Column(db.Float, default=10.0)
    unit_price = db.Column(db.Float, default=0.0)
    supplier_name = db.Column(db.String(100))
    last_restocked_date = db.Column(db.Date, default=datetime.utcnow().date)
    status = db.Column(db.String(30), default='in_stock') # in_stock, low_stock, out_of_stock
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        computed_status = 'out_of_stock' if self.quantity <= 0 else ('low_stock' if self.quantity <= self.min_stock_threshold else 'in_stock')
        return {
            'id': self.id,
            'item_name': self.item_name,
            'category': self.category,
            'quantity': self.quantity,
            'unit': self.unit,
            'min_stock_threshold': self.min_stock_threshold,
            'unit_price': self.unit_price,
            'supplier_name': self.supplier_name,
            'last_restocked_date': self.last_restocked_date.isoformat() if self.last_restocked_date else None,
            'status': computed_status
        }

# -------------------------------------------------------------
# 12. STAFF & STAFF ATTENDANCE
# -------------------------------------------------------------
class Staff(db.Model):
    __tablename__ = 'staff'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=True)
    staff_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(30), nullable=False)
    designation = db.Column(db.String(80), nullable=False) # warden, accountant, security, cleaning, electrician, plumber, chef
    department = db.Column(db.String(80))
    salary = db.Column(db.Float, default=0.0)
    joining_date = db.Column(db.Date, default=datetime.utcnow().date)
    shift = db.Column(db.String(30), default='general') # morning, evening, night, general
    emergency_contact = db.Column(db.String(50))
    status = db.Column(db.String(30), default='active') # active, on_leave, resigned, terminated
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    attendances = db.relationship('StaffAttendance', backref='staff', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'staff_code': self.staff_code,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'designation': self.designation,
            'department': self.department,
            'salary': self.salary,
            'joining_date': self.joining_date.isoformat() if self.joining_date else None,
            'shift': self.shift,
            'emergency_contact': self.emergency_contact,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class StaffAttendance(db.Model):
    __tablename__ = 'staff_attendance'
    __table_args__ = (db.UniqueConstraint('staff_id', 'date', name='uq_staff_date_attendance'),)

    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='present') # present, absent, on_leave, half_day
    check_in_time = db.Column(db.String(20))
    check_out_time = db.Column(db.String(20))
    remarks = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'staff_id': self.staff_id,
            'staff_name': self.staff.name if self.staff else None,
            'staff_code': self.staff.staff_code if self.staff else None,
            'date': self.date.isoformat() if self.date else None,
            'status': self.status,
            'check_in_time': self.check_in_time,
            'check_out_time': self.check_out_time,
            'remarks': self.remarks
        }

# -------------------------------------------------------------
# 13. NOTIFICATIONS & ANNOUNCEMENTS
# -------------------------------------------------------------
class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(30), default='info') # info, warning, success, urgent
    link = db.Column(db.String(255))
    is_read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'link': self.link,
            'is_read': self.is_read,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Announcement(db.Model):
    __tablename__ = 'announcements'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    content = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default='normal') # normal, high, urgent
    target_audience = db.Column(db.String(30), default='all') # all, students, staff, wardens
    is_emergency = db.Column(db.Boolean, default=False)
    published_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    expires_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    published_by = db.relationship('User', foreign_keys=[published_by_id])

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'priority': self.priority,
            'target_audience': self.target_audience,
            'is_emergency': self.is_emergency,
            'published_by': self.published_by.full_name if self.published_by else 'Hostel Administration',
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# -------------------------------------------------------------
# 14. AUDIT LOGS, EXPENSES & SETTINGS
# -------------------------------------------------------------
class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    module = db.Column(db.String(50), nullable=False)
    details = db.Column(db.Text)
    ip_address = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    user = db.relationship('User', foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else 'System',
            'action': self.action,
            'module': self.module,
            'details': self.details,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Expense(db.Model):
    __tablename__ = 'expenses'
    id = db.Column(db.Integer, primary_key=True)
    expense_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), nullable=False) # maintenance, mess_grocery, electricity_bill, water_bill, cleaning_supplies, staff_salary, internet_cable, repairs, miscellaneous
    amount = db.Column(db.Float, nullable=False, default=0.0)
    payment_method = db.Column(db.String(50), default='bank_transfer')
    invoice_reference = db.Column(db.String(100))
    expense_date = db.Column(db.Date, default=datetime.utcnow().date, nullable=False)
    paid_to = db.Column(db.String(100))
    approved_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    receipt_url = db.Column(db.String(255))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    approved_by = db.relationship('User', foreign_keys=[approved_by_id])

    def to_dict(self):
        return {
            'id': self.id,
            'expense_code': self.expense_code,
            'title': self.title,
            'category': self.category,
            'amount': self.amount,
            'payment_method': self.payment_method,
            'invoice_reference': self.invoice_reference,
            'expense_date': self.expense_date.isoformat() if self.expense_date else None,
            'paid_to': self.paid_to,
            'approved_by': self.approved_by.full_name if self.approved_by else 'Admin',
            'receipt_url': self.receipt_url,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Setting(db.Model):
    __tablename__ = 'settings'
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=False)
    description = db.Column(db.String(255))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'key': self.key,
            'value': self.value,
            'description': self.description,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
