import os
import sys
from datetime import datetime, date, timedelta

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.models import (
    db, Role, User, Hostel, Building, Floor, Room, Bed, RoomAllocation,
    Student, Parent, AdmissionApplication, FeeStructure, Invoice, Payment,
    Attendance, Complaint, ComplaintUpdate, MaintenanceRequest, Visitor,
    LeaveApplication, MessMenu, MessFeedback, MessInventory, Staff,
    StaffAttendance, Notification, Announcement, AuditLog, Expense, Setting
)

def seed_database(app_instance=None):
    target_app = app_instance or create_app('development')
    with target_app.app_context():
        print("Dropping existing tables and rebuilding schema...")
        db.drop_all()
        db.create_all()

        print("1. Seeding User Roles...")
        roles_data = [
            ('super_admin', 'Super Administrator', 'Full system access and root administrative privileges'),
            ('hostel_admin', 'Hostel Administrator', 'Manages hostels, facilities, staff, and overall operations'),
            ('warden', 'Hostel Warden', 'Manages students, attendance, room allocations, leaves, and discipline'),
            ('accountant', 'Finance & Accountant', 'Manages fees, invoices, payments, expense records, and fiscal reports'),
            ('student', 'Resident Student', 'Hostel resident with access to personal portal and self-service features')
        ]
        roles_map = {}
        for name, d_name, desc in roles_data:
            role = Role(name=name, display_name=d_name, description=desc)
            db.session.add(role)
            roles_map[name] = role
        db.session.flush()

        print("2. Seeding Core Demo Users...")
        users_to_create = [
            ('admin', 'admin@hostel.edu', 'Admin@123', 'Dr. Arthur Pendelton', '+1 555-0101', 'super_admin'),
            ('hosteladmin', 'hadmin@hostel.edu', 'HostelAdmin@123', 'Prof. Eleanor Vance', '+1 555-0102', 'hostel_admin'),
            ('warden', 'warden@hostel.edu', 'Warden@123', 'Captain Marcus Brody', '+1 555-0103', 'warden'),
            ('accountant', 'finance@hostel.edu', 'Accountant@123', 'Claire Sterling, CPA', '+1 555-0104', 'accountant'),
            ('student', 'alex.mercer@student.edu', 'Student@123', 'Alex Mercer', '+1 555-0105', 'student')
        ]
        users_map = {}
        for username, email, pwd, fname, phone, rname in users_to_create:
            user = User(
                username=username,
                email=email,
                full_name=fname,
                phone=phone,
                role_id=roles_map[rname].id,
                is_active=True
            )
            user.set_password(pwd)
            db.session.add(user)
            users_map[username] = user
        db.session.flush()

        print("3. Seeding Hostel, Buildings, Floors, Rooms & Beds...")
        hostel = Hostel(
            name="Grand Horizon University Hostel",
            code="GHUH-01",
            campus="North Academic Campus",
            address="742 Evergreen Academic Way, Metro City",
            phone="+1 555-888-0000",
            email="housing@horizon.edu",
            total_capacity=120,
            status="active"
        )
        db.session.add(hostel)
        db.session.flush()

        b1 = Building(
            hostel_id=hostel.id,
            name="Emerald Tower (Boys Residence)",
            code="EMR-TWR",
            total_floors=3,
            gender_type="male",
            description="Modern 3-story boys residential block with study lounges"
        )
        b2 = Building(
            hostel_id=hostel.id,
            name="Sapphire Hall (Girls Residence)",
            code="SPH-HLL",
            total_floors=3,
            gender_type="female",
            description="Secure 3-story girls residence with biometric gate"
        )
        db.session.add_all([b1, b2])
        db.session.flush()

        # Floors and Rooms
        rooms_list = []
        for building in [b1, b2]:
            for f_idx in range(3):
                f_name = "Ground Floor" if f_idx == 0 else f"Floor {f_idx}"
                floor = Floor(building_id=building.id, floor_number=f_idx, floor_name=f_name)
                db.session.add(floor)
                db.session.flush()

                # 4 rooms per floor
                for r_num in range(1, 5):
                    room_number = f"{building.code[:1]}{f_idx}{r_num:02d}"
                    rtype = 'single' if r_num == 1 else ('double' if r_num <= 3 else 'triple')
                    cap = 1 if rtype == 'single' else (2 if rtype == 'double' else 3)
                    price = 450.0 if rtype == 'single' else (320.0 if rtype == 'double' else 250.0)
                    is_ac = True if (r_num % 2 == 0) else False

                    room = Room(
                        building_id=building.id,
                        floor_id=floor.id,
                        room_number=room_number,
                        room_type=rtype,
                        capacity=cap,
                        base_price_per_month=price,
                        is_ac=is_ac,
                        has_attached_bathroom=True,
                        facilities="High-Speed Wi-Fi, Air Conditioning, Study Desk, Bookshelf, Wardrobe",
                        status="available"
                    )
                    db.session.add(room)
                    db.session.flush()
                    rooms_list.append(room)

                    for b_i in range(cap):
                        bed = Bed(
                            room_id=room.id,
                            bed_number=f"Bed-{chr(65 + b_i)}",
                            is_occupied=False,
                            status="available"
                        )
                        db.session.add(bed)

        db.session.flush()

        print("4. Seeding Staff Members...")
        staff_data = [
            ('STF-2025-001', 'Captain Marcus Brody', 'warden@hostel.edu', '+1 555-0103', 'Head Warden', 'Administration', 4200.0, users_map['warden'].id),
            ('STF-2025-002', 'Claire Sterling, CPA', 'finance@hostel.edu', '+1 555-0104', 'Senior Accountant', 'Finance', 3900.0, users_map['accountant'].id),
            ('STF-2025-003', 'Officer David Reyes', 'security.reyes@hostel.edu', '+1 555-0201', 'Chief Security Officer', 'Security', 2800.0, None),
            ('STF-2025-004', 'James "Jim" O\'Connor', 'electrician.jim@hostel.edu', '+1 555-0202', 'Maintenance Electrician', 'Maintenance', 2600.0, None),
            ('STF-2025-005', 'Maria Gonzalez', 'chef.maria@hostel.edu', '+1 555-0203', 'Head Chef & Kitchen Supervisor', 'Mess Operations', 3100.0, None),
            ('STF-2025-006', 'Suresh Patel', 'plumbing.suresh@hostel.edu', '+1 555-0204', 'Maintenance Plumber', 'Maintenance', 2550.0, None)
        ]
        staff_map = {}
        for scode, sname, semail, sphone, sdesig, sdept, ssal, suid in staff_data:
            staff = Staff(
                user_id=suid,
                staff_code=scode,
                name=sname,
                email=semail,
                phone=sphone,
                designation=sdesig,
                department=sdept,
                salary=ssal,
                joining_date=date(2023, 8, 15),
                shift='general',
                status='active'
            )
            db.session.add(staff)
            staff_map[scode] = staff
        db.session.flush()

        print("5. Seeding Students & Parent Information...")
        students_info = [
            ('STU20250001', 'Alex', 'Mercer', 'alex.mercer@student.edu', '+1 555-0105', 'male', 'Computer Science', 'B.Tech CS', '3rd Year', users_map['student'].id),
            ('STU20250002', 'Sophia', 'Chen', 'sophia.chen@student.edu', '+1 555-0301', 'female', 'Data Science', 'M.Sc Data Analytics', '1st Year', None),
            ('STU20250003', 'Ethan', 'Walker', 'ethan.walker@student.edu', '+1 555-0302', 'male', 'Mechanical Eng', 'B.Tech ME', '2nd Year', None),
            ('STU20250004', 'Olivia', 'Taylor', 'olivia.taylor@student.edu', '+1 555-0303', 'female', 'Business Admin', 'BBA', '4th Year', None),
            ('STU20250005', 'Liam', 'Patel', 'liam.patel@student.edu', '+1 555-0304', 'male', 'Civil Eng', 'B.Tech Civil', '2nd Year', None),
            ('STU20250006', 'Emma', 'Davis', 'emma.davis@student.edu', '+1 555-0305', 'female', 'Biotechnology', 'B.Tech Biotech', '3rd Year', None),
            ('STU20250007', 'Noah', 'Robinson', 'noah.robinson@student.edu', '+1 555-0306', 'male', 'Architecture', 'B.Arch', '1st Year', None),
            ('STU20250008', 'Ava', 'Mitchell', 'ava.mitchell@student.edu', '+1 555-0307', 'female', 'Electrical Eng', 'B.Tech EEE', '2nd Year', None)
        ]
        created_students = []
        for scode, fn, ln, eml, ph, gnd, dept, crs, yr, uid in students_info:
            stu = Student(
                user_id=uid,
                student_id_code=scode,
                first_name=fn,
                last_name=ln,
                email=eml,
                phone=ph,
                gender=gnd,
                date_of_birth=date(2003, 5, 12),
                blood_group='O+',
                address='144 University Avenue, District 4',
                department=dept,
                course=crs,
                academic_year=yr,
                admission_date=date(2024, 8, 1),
                joining_date=date(2024, 8, 10),
                emergency_contact_name=f"Robert {ln}",
                emergency_contact_phone='+1 555-900-1122',
                emergency_contact_relation='Father',
                status='active'
            )
            db.session.add(stu)
            db.session.flush()

            parent = Parent(
                student_id=stu.id,
                father_name=f"Robert {ln}",
                father_phone='+1 555-900-1122',
                father_occupation='Professional Engineer',
                mother_name=f"Sarah {ln}",
                mother_phone='+1 555-900-1133',
                mother_occupation='Educator',
                residential_address='144 University Avenue, District 4'
            )
            db.session.add(parent)
            created_students.append(stu)

        db.session.flush()

        print("6. Allocating Rooms to Students...")
        # Allocate first 6 students to available beds
        for idx, student in enumerate(created_students[:6]):
            target_room = rooms_list[idx]
            first_bed = target_room.beds[0]
            alloc = RoomAllocation(
                student_id=student.id,
                room_id=target_room.id,
                bed_id=first_bed.id,
                allocation_date=date(2024, 8, 10),
                status='active',
                remarks='Standard academic year allocation',
                allocated_by_id=users_map['warden'].id
            )
            db.session.add(alloc)
            first_bed.is_occupied = True
            first_bed.status = 'occupied'
            if len(target_room.beds) == 1:
                target_room.status = 'full'

        db.session.flush()

        print("7. Seeding Fee Structures, Invoices & Payments...")
        fs1 = FeeStructure(name="Double Occupancy AC Room Fee", room_type="double", fee_type="monthly", amount=320.0, late_penalty_per_day=5.0, description="Includes electricity allowance and Wi-Fi")
        fs2 = FeeStructure(name="Single Premium AC Room Fee", room_type="single", fee_type="monthly", amount=450.0, late_penalty_per_day=10.0, description="Private room with en-suite bath")
        fs3 = FeeStructure(name="Comprehensive Mess Meal Plan", room_type="all", fee_type="mess", amount=180.0, late_penalty_per_day=2.0, description="4 meals daily (Breakfast, Lunch, Snacks, Dinner)")
        fs4 = FeeStructure(name="Refundable Security Deposit", room_type="all", fee_type="security_deposit", amount=500.0, late_penalty_per_day=0.0, description="Returned on checkout")
        db.session.add_all([fs1, fs2, fs3, fs4])
        db.session.flush()

        # Invoices and payments for Alex Mercer and other students
        today = date.today()
        inv1 = Invoice(
            invoice_number="INV-2025-00101",
            student_id=created_students[0].id,
            title="November 2025 Hostel & Mess Fee",
            fee_type="monthly",
            amount=500.0,
            discount_amount=0.0,
            late_fee=0.0,
            total_amount=500.0,
            paid_amount=500.0,
            balance_amount=0.0,
            status="paid",
            due_date=today - timedelta(days=5),
            issued_date=today - timedelta(days=20),
            billing_month="November",
            billing_year=2025,
            notes="Regular monthly boarding dues"
        )
        inv2 = Invoice(
            invoice_number="INV-2025-00102",
            student_id=created_students[0].id,
            title="December 2025 Hostel & Mess Advance",
            fee_type="monthly",
            amount=500.0,
            discount_amount=25.0,
            late_fee=0.0,
            total_amount=475.0,
            paid_amount=0.0,
            balance_amount=475.0,
            status="unpaid",
            due_date=today + timedelta(days=12),
            issued_date=today,
            billing_month="December",
            billing_year=2025,
            notes="Prompt early-bird discount applied"
        )
        inv3 = Invoice(
            invoice_number="INV-2025-00103",
            student_id=created_students[1].id,
            title="November 2025 Room & Utilities",
            fee_type="monthly",
            amount=320.0,
            discount_amount=0.0,
            late_fee=20.0,
            total_amount=340.0,
            paid_amount=150.0,
            balance_amount=190.0,
            status="partially_paid",
            due_date=today - timedelta(days=3),
            issued_date=today - timedelta(days=18),
            billing_month="November",
            billing_year=2025
        )
        db.session.add_all([inv1, inv2, inv3])
        db.session.flush()

        pay1 = Payment(
            payment_number="PAY-2025-00041",
            invoice_id=inv1.id,
            student_id=created_students[0].id,
            amount=500.0,
            payment_method="online",
            transaction_reference="TXN-20251110-A99FE4",
            payment_gateway="mock_gateway",
            status="successful",
            payment_date=datetime.utcnow() - timedelta(days=6),
            notes="Online portal checkout"
        )
        pay2 = Payment(
            payment_number="PAY-2025-00042",
            invoice_id=inv3.id,
            student_id=created_students[1].id,
            amount=150.0,
            payment_method="upi",
            transaction_reference="UPI-20251112-99014B",
            payment_gateway="mock_gateway",
            status="successful",
            payment_date=datetime.utcnow() - timedelta(days=2),
            notes="Partial UPI installment"
        )
        db.session.add_all([pay1, pay2])
        db.session.flush()

        print("8. Seeding Attendance History...")
        for days_back in range(14, -1, -1):
            att_date = today - timedelta(days=days_back)
            for idx, student in enumerate(created_students):
                # Alex is mostly present, occasional absent or leave
                stat = 'present'
                if idx == 1 and days_back in [3, 4]:
                    stat = 'on_leave'
                elif idx == 2 and days_back == 7:
                    stat = 'absent'

                att = Attendance(
                    student_id=student.id,
                    date=att_date,
                    status=stat,
                    marked_by_id=users_map['warden'].id,
                    remarks="Evening roll call verification"
                )
                db.session.add(att)

        db.session.flush()

        print("9. Seeding Complaints & Updates...")
        cmp1 = Complaint(
            complaint_code="CMP-2025-0012",
            student_id=created_students[0].id,
            category="electricity",
            title="Air Conditioner Tripping Circuit Breaker",
            description="Whenever the room AC is turned on, the mini circuit breaker trips within 10 minutes. Needs electrical inspection.",
            priority="high",
            status="in_progress",
            assigned_to_staff_id=staff_map['STF-2025-004'].id
        )
        cmp2 = Complaint(
            complaint_code="CMP-2025-0013",
            student_id=created_students[1].id,
            category="plumbing",
            title="Attached Bathroom Tap Leaking",
            description="The wash basin mixer tap has a persistent leak causing water pooling on the bathroom floor.",
            priority="medium",
            status="resolved",
            assigned_to_staff_id=staff_map['STF-2025-006'].id,
            resolution_notes="Replaced cartridge and washer seal. Fully tested and watertight.",
            resolved_at=datetime.utcnow() - timedelta(days=1),
            feedback_rating=5,
            feedback_comment="Fixed very quickly, thank you!"
        )
        db.session.add_all([cmp1, cmp2])
        db.session.flush()

        upd1 = ComplaintUpdate(
            complaint_id=cmp1.id,
            user_id=users_map['warden'].id,
            old_status="submitted",
            new_status="assigned",
            comment="Assigned to Electrician Jim O'Connor for inspection."
        )
        upd2 = ComplaintUpdate(
            complaint_id=cmp1.id,
            user_id=users_map['warden'].id,
            old_status="assigned",
            new_status="in_progress",
            comment="Technician on site; parts ordered."
        )
        db.session.add_all([upd1, upd2])
        db.session.flush()

        print("10. Seeding Maintenance Requests...")
        mnt1 = MaintenanceRequest(
            request_code="MNT-2025-0008",
            title="Corridor Lighting & Emergency Exit Signs Overhaul",
            category="electrical",
            priority="high",
            description="Replace burned fluorescent tubes with LED fixtures on 2nd Floor Emerald Tower.",
            location_details="Floor 2, Emerald Tower",
            room_id=None,
            assigned_to_staff_id=staff_map['STF-2025-004'].id,
            scheduled_date=today + timedelta(days=2),
            estimated_cost=240.0,
            actual_cost=0.0,
            status="scheduled",
            created_by_id=users_map['hosteladmin'].id
        )
        mnt2 = MaintenanceRequest(
            request_code="MNT-2025-0009",
            title="Water Pump Motor Servicing and Impeller Replacement",
            category="plumbing",
            priority="urgent",
            description="Main overhead water tank booster pump bearing noise.",
            location_details="Hostel Utility Basement",
            assigned_to_staff_id=staff_map['STF-2025-006'].id,
            scheduled_date=today - timedelta(days=4),
            estimated_cost=450.0,
            actual_cost=415.0,
            status="completed",
            completion_notes="New bearings installed, grease re-packed, pressure tested at 4.2 bar.",
            created_by_id=users_map['warden'].id
        )
        db.session.add_all([mnt1, mnt2])
        db.session.flush()

        print("11. Seeding Visitors & Leaves...")
        vis1 = Visitor(
            visitor_name="Robert Mercer",
            phone="+1 555-900-1122",
            id_proof_type="Driver License",
            id_proof_number="DL-882914-CA",
            student_id=created_students[0].id,
            purpose="Delivering winter clothes and laptop accessories",
            check_in_time=datetime.utcnow() - timedelta(hours=3),
            status="checked_in",
            approved_by_id=users_map['warden'].id,
            vehicle_number="CA-592-KPT"
        )
        vis2 = Visitor(
            visitor_name="Samantha Taylor",
            phone="+1 555-900-3344",
            id_proof_type="National ID",
            id_proof_number="NID-442019",
            student_id=created_students[3].id,
            purpose="Weekend family visit",
            check_in_time=datetime.utcnow() - timedelta(days=2, hours=4),
            check_out_time=datetime.utcnow() - timedelta(days=2, hours=1),
            status="checked_out",
            approved_by_id=users_map['warden'].id
        )
        db.session.add_all([vis1, vis2])

        lev1 = LeaveApplication(
            leave_code="LEV-2025-0031",
            student_id=created_students[0].id,
            leave_type="home",
            from_date=today + timedelta(days=5),
            to_date=today + timedelta(days=8),
            reason="Sister's wedding reception in home town",
            parent_phone="+1 555-900-1122",
            parent_consent=True,
            status="approved",
            approved_by_id=users_map['warden'].id,
            approval_remarks="Parent consent verified over telephone call."
        )
        lev2 = LeaveApplication(
            leave_code="LEV-2025-0032",
            student_id=created_students[1].id,
            leave_type="academic",
            from_date=today + timedelta(days=2),
            to_date=today + timedelta(days=4),
            reason="Participating in National University Hackathon 2025",
            parent_phone="+1 555-900-1133",
            parent_consent=True,
            status="pending"
        )
        db.session.add_all([lev1, lev2])
        db.session.flush()

        print("12. Seeding Admission Applications...")
        app1 = AdmissionApplication(
            application_number="APP20250081",
            first_name="Julian",
            last_name="Vance",
            email="julian.vance@student.edu",
            phone="+1 555-0401",
            gender="male",
            date_of_birth=date(2004, 9, 21),
            blood_group="B+",
            address="512 Beacon Hill Rd, Westford",
            department="Computer Science",
            course="B.Tech Artificial Intelligence",
            academic_year="2025-2026",
            preferred_room_type="double",
            parent_name="Charles Vance",
            parent_phone="+1 555-0402",
            emergency_contact="+1 555-0402",
            status="pending"
        )
        app2 = AdmissionApplication(
            application_number="APP20250082",
            first_name="Serena",
            last_name="Williams",
            email="serena.williams@student.edu",
            phone="+1 555-0403",
            gender="female",
            date_of_birth=date(2004, 3, 14),
            blood_group="A+",
            address="19 Oakridge Blvd, Springvale",
            department="Economics",
            course="B.A. Economics (Hons)",
            academic_year="2025-2026",
            preferred_room_type="single",
            parent_name="Marcus Williams",
            parent_phone="+1 555-0404",
            emergency_contact="+1 555-0404",
            status="waitlisted"
        )
        db.session.add_all([app1, app2])
        db.session.flush()

        print("13. Seeding Weekly Mess Menus...")
        days_of_week = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        menu_templates = {
            'breakfast': ("07:30 AM - 09:30 AM", "Idli, Sambar, Coconut Chutney, Poori Bhaji, Boiled Eggs, Fresh Fruits, Tea & Coffee"),
            'lunch': ("12:30 PM - 02:30 PM", "Steamed Basmati Rice, Paneer Butter Masala, Dal Tadka, Seasonal Mix Veg, Curd, Salad, Gulab Jamun"),
            'snacks': ("04:45 PM - 06:00 PM", "Crispy Samosa, Mint Chutney, Assorted Cookies, Cardamom Tea, Coffee"),
            'dinner': ("07:45 PM - 09:45 PM", "Phulka Roti, Chicken Curry (or Kadai Paneer for Veg), Steamed Rice, Yellow Dal, Fruit Custard")
        }
        for d in days_of_week:
            for m_type, (timing, items) in menu_templates.items():
                m_entry = MessMenu(
                    day_of_week=d,
                    meal_type=m_type,
                    items=items,
                    timing=timing,
                    special_diet="Nut-free and vegetarian options clearly separated",
                    is_active=True
                )
                db.session.add(m_entry)

        db.session.flush()

        print("14. Seeding Mess Feedback & Inventory...")
        fb = MessFeedback(
            student_id=created_students[0].id,
            date=today,
            meal_type="lunch",
            rating=5,
            hygiene_rating=5,
            quality_rating=5,
            comments="Paneer butter masala and rotis were fresh and warm. Excellent lunch today!"
        )
        db.session.add(fb)

        inv_items = [
            ("Basmati Rice Grade A", "grains", 450.0, "kg", 80.0, 1.85, "Agro Fresh Traders"),
            ("Whole Wheat Atta", "grains", 320.0, "kg", 50.0, 1.20, "Golden Harvest Mills"),
            ("Toor Dal / Lentils", "grains", 180.0, "kg", 30.0, 2.40, "Sunrise Organic Pulses"),
            ("Refined Sunflower Oil", "beverages", 140.0, "liters", 30.0, 3.10, "Pure Drop Oils"),
            ("Pasteurized Milk Cans", "dairy", 85.0, "liters", 20.0, 1.15, "Metro Dairy Coop"),
            ("Fresh Paneer", "dairy", 18.0, "kg", 10.0, 5.50, "Metro Dairy Coop")
        ]
        for iname, icat, iqty, iunit, ithresh, iprice, isupp in inv_items:
            inv = MessInventory(
                item_name=iname,
                category=icat,
                quantity=iqty,
                unit=iunit,
                min_stock_threshold=ithresh,
                unit_price=iprice,
                supplier_name=isupp,
                last_restocked_date=today - timedelta(days=3)
            )
            db.session.add(inv)

        db.session.flush()

        print("15. Seeding Notifications, Announcements, Expenses & Settings...")
        notif1 = Notification(
            user_id=users_map['student'].id,
            title="Room Allocation Confirmed",
            message="Your allocation to Emerald Tower (Room E001, Bed-A) has been approved by the Warden.",
            type="success",
            link="/student/room"
        )
        notif2 = Notification(
            user_id=users_map['student'].id,
            title="Fee Invoice Due Reminder",
            message="December Advance Fee Invoice #INV-2025-00102 has been generated.",
            type="warning",
            link="/student/fees"
        )
        db.session.add_all([notif1, notif2])

        ann1 = Announcement(
            title="Campus High-Speed Wi-Fi Upgrade Scheduled",
            content="IT infrastructure will be upgrading core fiber routers on Saturday from 02:00 AM to 05:00 AM. Minor downtime expected.",
            priority="normal",
            target_audience="all",
            is_emergency=False,
            published_by_id=users_map['hosteladmin'].id
        )
        ann2 = Announcement(
            title="Fire Evacuation Safety Drill on Tuesday at 4 PM",
            content="All residents and hostel staff must assemble in the northern courtyard promptly at the sound of the siren.",
            priority="urgent",
            target_audience="all",
            is_emergency=True,
            published_by_id=users_map['warden'].id
        )
        db.session.add_all([ann1, ann2])

        exp1 = Expense(
            expense_code="EXP-2025-0001",
            title="High-Speed Fiber Optic Internet Commercial Bill",
            category="internet_cable",
            amount=850.0,
            payment_method="bank_transfer",
            invoice_reference="FIBER-TEL-98214",
            expense_date=today - timedelta(days=8),
            paid_to="Metro Telecom Solutions",
            approved_by_id=users_map['accountant'].id,
            notes="Quarterly institutional internet line"
        )
        exp2 = Expense(
            expense_code="EXP-2025-0002",
            title="Bulk Kitchen Grocery Restock Order #418",
            category="mess_grocery",
            amount=1420.0,
            payment_method="bank_transfer",
            invoice_reference="INV-AGRO-41829",
            expense_date=today - timedelta(days=3),
            paid_to="Agro Fresh Traders",
            approved_by_id=users_map['accountant'].id
        )
        db.session.add_all([exp1, exp2])

        # System Settings
        settings_data = [
            ("hostel_name", "Grand Horizon University Hostel", "Official organization name"),
            ("currency_symbol", "$", "Platform currency symbol"),
            ("default_check_in_curfew", "21:30", "Night curfew gate check-in time"),
            ("late_fee_per_day", "10", "Default daily late fee penalty ($)"),
            ("payment_gateway_mode", "test_sandbox", "Active payment gateway operational mode"),
            ("support_email", "housing@horizon.edu", "Administrative contact email"),
            ("visitor_allowed_start", "09:00", "Visitor entry start time"),
            ("visitor_allowed_end", "19:00", "Visitor entry cutoff time")
        ]
        for k, v, d in settings_data:
            setting = Setting(key=k, value=v, description=d)
            db.session.add(setting)

        # Audit log initial record
        audit = AuditLog(
            user_id=users_map['admin'].id,
            action="SYSTEM_INITIALIZATION",
            module="DATABASE",
            details="Database populated with complete demo records and configurations",
            ip_address="127.0.0.1"
        )
        db.session.add(audit)

        db.session.commit()
        print("\n=======================================================")
        print("DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("Demo User Credentials:")
        print("1. Super Admin:    admin / Admin@123")
        print("2. Hostel Admin:   hosteladmin / HostelAdmin@123")
        print("3. Warden:         warden / Warden@123")
        print("4. Accountant:     accountant / Accountant@123")
        print("5. Student:        student / Student@123")
        print("=======================================================\n")

if __name__ == '__main__':
    seed_database()
