import pytest
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import db
from seed import seed_database

@pytest.fixture(scope='module')
def client():
    app = create_app('testing')
    with app.app_context():
        # Seed test database once for the test module
        seed_database(app)
        with app.test_client() as test_client:
            yield test_client
        db.session.remove()
        db.drop_all()

def test_health_check(client):
    res = client.get('/api/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] == 'healthy'
    assert 'HOSTEL MANAGEMENT SYSTEM' in data['platform']

def test_auth_login_success(client):
    res = client.post('/api/auth/login', json={
        'username': 'admin',
        'password': 'Admin@123'
    })
    assert res.status_code == 200
    data = res.get_json()
    assert 'token' in data
    assert data['user']['role'] == 'super_admin'

def test_auth_login_invalid(client):
    res = client.post('/api/auth/login', json={
        'username': 'admin',
        'password': 'WrongPassword999'
    })
    assert res.status_code == 401
    data = res.get_json()
    assert 'error' in data

def test_dashboard_stats(client):
    login_res = client.post('/api/auth/login', json={'username': 'admin', 'password': 'Admin@123'})
    token = login_res.get_json()['token']
    headers = {'Authorization': f'Bearer {token}'}

    res = client.get('/api/dashboard/stats', headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data['total_students'] > 0
    assert data['total_rooms'] > 0
    assert data['total_capacity'] > 0

def test_student_listing_and_detail(client):
    login_res = client.post('/api/auth/login', json={'username': 'admin', 'password': 'Admin@123'})
    token = login_res.get_json()['token']
    headers = {'Authorization': f'Bearer {token}'}

    res = client.get('/api/students/', headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert len(data['students']) > 0

    student_id = data['students'][0]['id']
    detail_res = client.get(f'/api/students/{student_id}', headers=headers)
    assert detail_res.status_code == 200
    detail = detail_res.get_json()
    assert detail['id'] == student_id
    assert 'invoices' in detail
    assert 'attendance_summary' in detail

def test_room_allocation_workflow(client):
    login_res = client.post('/api/auth/login', json={'username': 'warden', 'password': 'Warden@123'})
    token = login_res.get_json()['token']
    headers = {'Authorization': f'Bearer {token}'}

    # Find unallocated student
    students = client.get('/api/students/', headers=headers).get_json()['students']
    unallocated_stu = None
    for s in students:
        if not s.get('current_room_id'):
            unallocated_stu = s
            break

    rooms = client.get('/api/rooms/', headers=headers).get_json()
    target_room = None
    target_bed = None
    for r in rooms:
        for b in r.get('beds', []):
            if not b['is_occupied']:
                target_room = r
                target_bed = b
                break
        if target_bed:
            break

    if unallocated_stu and target_room and target_bed:
        alloc_res = client.post('/api/rooms/allocate', json={
            'student_id': unallocated_stu['id'],
            'room_id': target_room['id'],
            'bed_id': target_bed['id'],
            'remarks': 'Test allocation'
        }, headers=headers)
        assert alloc_res.status_code == 201

def test_fee_payment_processing(client):
    login_res = client.post('/api/auth/login', json={'username': 'student', 'password': 'Student@123'})
    token = login_res.get_json()['token']
    headers = {'Authorization': f'Bearer {token}'}

    invoices = client.get('/api/fees/invoices', headers=headers).get_json()
    assert len(invoices) > 0
    target_inv = invoices[0]

    pay_res = client.post('/api/fees/payments', json={
        'invoice_id': target_inv['id'],
        'amount': 50.0,
        'payment_method': 'online',
        'payment_gateway': 'mock_gateway',
        'notes': 'Test payment processing'
    }, headers=headers)
    assert pay_res.status_code == 201
    pay_data = pay_res.get_json()
    assert pay_data['payment']['status'] == 'successful'
    assert 'transaction_reference' in pay_data['payment']

def test_attendance_marking(client):
    login_res = client.post('/api/auth/login', json={'username': 'warden', 'password': 'Warden@123'})
    token = login_res.get_json()['token']
    headers = {'Authorization': f'Bearer {token}'}

    students = client.get('/api/students/', headers=headers).get_json()['students']
    stu_id = students[0]['id']

    mark_res = client.post('/api/attendance/mark', json={
        'student_id': stu_id,
        'status': 'present',
        'remarks': 'On-time evening assembly',
        'date': '2025-11-20'
    }, headers=headers)
    assert mark_res.status_code == 200

def test_complaint_lifecycle(client):
    login_stu = client.post('/api/auth/login', json={'username': 'student', 'password': 'Student@123'})
    token_stu = login_stu.get_json()['token']
    headers_stu = {'Authorization': f'Bearer {token_stu}'}

    cmp_res = client.post('/api/complaints/', json={
        'title': 'Desk Lamp Bulb Needs Replacement',
        'description': 'The fluorescent desk bulb in Room E001 flickers constantly.',
        'category': 'electricity',
        'priority': 'medium'
    }, headers=headers_stu)
    assert cmp_res.status_code == 201
    cmp_id = cmp_res.get_json()['complaint']['id']

    login_warden = client.post('/api/auth/login', json={'username': 'warden', 'password': 'Warden@123'})
    token_warden = login_warden.get_json()['token']
    headers_warden = {'Authorization': f'Bearer {token_warden}'}

    upd_res = client.put(f'/api/complaints/{cmp_id}/status', json={
        'status': 'resolved',
        'resolution_notes': 'Replaced bulb with 12W warm white LED bulb.'
    }, headers=headers_warden)
    assert upd_res.status_code == 200

def test_reports_export_csv_and_excel(client):
    login_res = client.post('/api/auth/login', json={'username': 'admin', 'password': 'Admin@123'})
    token = login_res.get_json()['token']
    headers = {'Authorization': f'Bearer {token}'}

    csv_res = client.get('/api/reports/export?type=students&format=csv', headers=headers)
    assert csv_res.status_code == 200
    assert 'text/csv' in csv_res.content_type

    xls_res = client.get('/api/reports/export?type=occupancy&format=excel', headers=headers)
    assert xls_res.status_code == 200
    assert 'spreadsheetml' in xls_res.content_type
