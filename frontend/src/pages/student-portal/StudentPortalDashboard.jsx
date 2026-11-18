import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import {
  DoorOpen,
  CreditCard,
  CalendarCheck,
  MessageSquareWarning,
  PlaneTakeoff,
  UtensilsCrossed,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Plus
} from 'lucide-react';
import Modal from '../../components/common/Modal';

const StudentPortalDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [student, setStudent] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [todayMenu, setTodayMenu] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Pay Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [paying, setPaying] = useState(false);

  // Quick Complaint Modal
  const [showCmpModal, setShowCmpModal] = useState(false);
  const [cmpData, setCmpData] = useState({
    title: '',
    category: 'electricity',
    priority: 'medium',
    description: '',
  });

  // Quick Leave Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveData, setLeaveData] = useState({
    leave_type: 'home',
    from_date: '',
    to_date: '',
    reason: '',
    parent_phone: '',
  });

  useEffect(() => {
    fetchStudentPortalData();
  }, [user]);

  const fetchStudentPortalData = async () => {
    setLoading(true);
    try {
      const stuRes = await api.get('/students/');
      const studentData = stuRes.data.students?.[0] || null;
      setStudent(studentData);

      if (studentData) {
        const [invRes, attRes, cmpRes, levRes, menuRes, annRes] = await Promise.all([
          api.get(`/fees/invoices?student_id=${studentData.id}`),
          api.get(`/attendance/student/${studentData.id}`),
          api.get(`/complaints/?student_id=${studentData.id}`),
          api.get(`/leaves/?student_id=${studentData.id}`),
          api.get('/mess/menu'),
          api.get('/notifications/announcements'),
        ]);

        setInvoices(invRes.data || []);
        setAttendance(attRes.data || null);
        setComplaints(cmpRes.data || []);
        setLeaves(levRes.data || []);
        setAnnouncements(annRes.data || []);

        // Today's day name in lowercase
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = days[new Date().getDay()];
        setTodayMenu(menuRes.data.calendar?.[currentDay] || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      await api.post('/fees/payments', {
        invoice_id: selectedInvoice?.id,
        student_id: student?.id,
        amount: Number(payAmount),
        payment_method: 'online',
        payment_gateway: 'mock_gateway',
        notes: `Online portal checkout for ${selectedInvoice?.invoice_number}`,
      });
      toast.success('Payment authorized and cleared successfully!');
      setShowPayModal(false);
      fetchStudentPortalData();
    } catch (err) {
      toast.error('Payment authorization failed');
    } finally {
      setPaying(false);
    }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/complaints/', {
        ...cmpData,
        student_id: student?.id,
      });
      toast.success('Complaint ticket submitted');
      setShowCmpModal(false);
      setCmpData({ title: '', category: 'electricity', priority: 'medium', description: '' });
      fetchStudentPortalData();
    } catch (err) {
      toast.error('Failed to submit complaint');
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leaves/', {
        ...leaveData,
        student_id: student?.id,
        parent_phone: leaveData.parent_phone || student?.emergency_contact_phone,
      });
      toast.success('Leave application submitted to Warden');
      setShowLeaveModal(false);
      fetchStudentPortalData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit leave request');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm font-semibold text-slate-500">Loading Student Portal...</div>
      </div>
    );
  }

  const unpaidInvoices = invoices.filter((i) => i.balance_amount > 0);
  const totalDue = unpaidInvoices.reduce((acc, i) => acc + i.balance_amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md">
              Resident Student Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-2">
              Hello, {student?.first_name || user?.full_name}!
            </h1>
            <p className="text-xs text-primary-100 mt-1 max-w-lg">
              Campus ID: <span className="font-mono font-bold">{student?.student_id_code}</span> &bull; {student?.course} &bull; Room {student?.current_room_number || 'Unallocated'} ({student?.current_bed_number || '-'})
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setShowCmpModal(true)}
              className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <MessageSquareWarning className="w-4 h-4" />
              <span>Report Issue</span>
            </button>
            <button
              onClick={() => {
                setLeaveData((prev) => ({ ...prev, parent_phone: student?.emergency_contact_phone || '' }));
                setShowLeaveModal(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-white text-primary-700 hover:bg-primary-50 font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <PlaneTakeoff className="w-4 h-4" />
              <span>Apply for Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Room Info Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">My Room & Bed</span>
            <DoorOpen className="w-5 h-5 text-primary-600" />
          </div>
          <div className="my-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {student?.current_room_number ? `Room ${student?.current_room_number}` : 'Unallocated'}
            </div>
            <div className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-0.5">
              {student?.current_bed_number ? `Assigned Bed: ${student?.current_bed_number}` : 'No bed allocated yet'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{student?.building_name || 'Grand Horizon Campus'}</div>
          </div>
          <Link
            to="/student/room"
            className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline"
          >
            <span>View room amenities & details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Attendance Rate Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Attendance Rate</span>
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {attendance?.percentage || 100}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {attendance?.present || 0} Present &bull; {attendance?.absent || 0} Absent &bull; {attendance?.on_leave || 0} on Leave
            </div>
          </div>
          <Link
            to="/student/attendance"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
          >
            <span>View complete attendance history</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Due Fee Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Outstanding Dues</span>
            <CreditCard className="w-5 h-5 text-amber-600" />
          </div>
          <div className="my-3">
            <div className={`text-3xl font-black ${totalDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {formatCurrency(totalDue)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {totalDue > 0 ? `${unpaidInvoices.length} pending billable invoices` : 'All invoices cleared'}
            </div>
          </div>
          <Link
            to="/student/fees"
            className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline"
          >
            <span>View invoices & download receipts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Due Invoices Alert Box if dues exist */}
      {unpaidInvoices.length > 0 && (
        <div className="p-5 rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <div className="text-sm font-bold text-amber-950 dark:text-amber-200">
                You have {unpaidInvoices.length} outstanding fee invoice(s)
              </div>
              <div className="text-xs text-amber-800 dark:text-amber-400 mt-0.5">
                Total unpaid balance of {formatCurrency(totalDue)}. Please clear your dues before the deadline.
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedInvoice(unpaidInvoices[0]);
              setPayAmount(unpaidInvoices[0].balance_amount);
              setShowPayModal(true);
            }}
            className="py-2 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition shrink-0"
          >
            Pay Now ({formatCurrency(unpaidInvoices[0].balance_amount)})
          </button>
        </div>
      )}

      {/* Today's Mess Dining Menu */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-primary-600" />
            Today's Dining Hall Menu
          </h3>
          <Link to="/student/mess" className="text-xs font-bold text-primary-600 hover:underline">
            Weekly Calendar & Review
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {['breakfast', 'lunch', 'snacks', 'dinner'].map((meal) => {
            const item = todayMenu[meal];
            return (
              <div key={meal} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between font-bold text-xs uppercase text-slate-800 dark:text-slate-200">
                  <span>{meal}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{item?.timing || ''}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mt-1">
                  {item?.items || 'Standard catering service'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Service Requests & Leaves Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My Complaints */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                My Reported Complaints ({complaints.length})
              </h3>
              <button
                onClick={() => setShowCmpModal(true)}
                className="text-xs font-bold text-primary-600 hover:underline"
              >
                + New Ticket
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {complaints.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No active complaints logged.</div>
              ) : (
                complaints.slice(0, 3).map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{c.title}</div>
                      <div className="text-[11px] text-slate-400 capitalize">{c.category} &bull; {c.complaint_code}</div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* My Leaves */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                My Leave Passes ({leaves.length})
              </h3>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="text-xs font-bold text-primary-600 hover:underline"
              >
                + Apply Leave
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaves.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No leave applications found.</div>
              ) : (
                leaves.slice(0, 3).map((l) => (
                  <div key={l.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {formatDate(l.from_date)} &rarr; {formatDate(l.to_date)}
                      </div>
                      <div className="text-[11px] text-slate-400 capitalize">{l.leave_type} Pass &bull; {l.leave_code}</div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(l.status)}`}>
                      {l.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pay Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={showPayModal}
          onClose={() => setShowPayModal(false)}
          title={`Pay Invoice: ${selectedInvoice.invoice_number}`}
        >
          <form onSubmit={handlePaySubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">{selectedInvoice.title}</div>
              <div className="text-slate-500">Remaining Balance: <b>{formatCurrency(selectedInvoice.balance_amount)}</b></div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Mock Gateway Test Mode: Instant settlement simulator. No real bank charges.
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={paying}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold disabled:opacity-50"
              >
                {paying ? 'Processing...' : 'Authorize Payment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Complaint Modal */}
      <Modal
        isOpen={showCmpModal}
        onClose={() => setShowCmpModal(false)}
        title="Lodge Maintenance / Service Complaint"
      >
        <form onSubmit={handleComplaintSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Issue Title *</label>
            <input
              type="text"
              required
              value={cmpData.title}
              onChange={(e) => setCmpData({ ...cmpData, title: e.target.value })}
              placeholder="e.g. Bathroom light flickering or Wi-Fi disconnection"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={cmpData.category}
                onChange={(e) => setCmpData({ ...cmpData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="electricity">Electricity</option>
                <option value="water_supply">Water Supply</option>
                <option value="room_cleaning">Room Cleaning</option>
                <option value="internet">Internet & Wi-Fi</option>
                <option value="furniture">Furniture</option>
                <option value="plumbing">Plumbing</option>
                <option value="food_quality">Food Quality</option>
                <option value="security">Security</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select
                value={cmpData.priority}
                onChange={(e) => setCmpData({ ...cmpData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description *</label>
            <textarea
              rows={3}
              required
              value={cmpData.description}
              onChange={(e) => setCmpData({ ...cmpData, description: e.target.value })}
              placeholder="Provide exact details of what is broken or malfunctioning..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCmpModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold"
            >
              Submit Ticket
            </button>
          </div>
        </form>
      </Modal>

      {/* Leave Modal */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Apply for Overnight / Vacation Leave"
      >
        <form onSubmit={handleLeaveSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Departure Date *</label>
              <input
                type="date"
                required
                value={leaveData.from_date}
                onChange={(e) => setLeaveData({ ...leaveData, from_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Expected Return Date *</label>
              <input
                type="date"
                required
                value={leaveData.to_date}
                onChange={(e) => setLeaveData({ ...leaveData, to_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Leave Category</label>
              <select
                value={leaveData.leave_type}
                onChange={(e) => setLeaveData({ ...leaveData, leave_type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="home">Home Visit</option>
                <option value="vacation">Term Vacation</option>
                <option value="medical">Medical Treatment</option>
                <option value="academic">Academic Conference / Hackathon</option>
                <option value="emergency">Family Emergency</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Parent Contact Phone *</label>
              <input
                type="tel"
                required
                value={leaveData.parent_phone}
                onChange={(e) => setLeaveData({ ...leaveData, parent_phone: e.target.value })}
                placeholder="+1 555-0199"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reason for Leave *</label>
            <textarea
              rows={2}
              required
              value={leaveData.reason}
              onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowLeaveModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold"
            >
              Submit Application
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentPortalDashboard;
