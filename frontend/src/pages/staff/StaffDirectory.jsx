import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters';
import Modal from '../../components/common/Modal';
import { ShieldCheck, Plus, CheckCircle2, UserCheck, Phone, Mail, Calendar } from 'lucide-react';

const StaffDirectory = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('directory');
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attDate, setAttDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // Add Staff Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: 'Warden',
    department: 'Administration',
    salary: 3500,
    shift: 'general',
    emergency_contact: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendance();
  }, [activeTab, attDate]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff/');
      setStaff(res.data || []);
    } catch (err) {
      toast.error('Failed to load staff directory');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await api.get(`/staff/attendance?date=${attDate}`);
      setAttendance(res.data || []);
    } catch (err) {}
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/staff/', formData);
      toast.success(res.data.message || 'Staff member enrolled with login account');
      setShowAddModal(false);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkStaffAtt = async (staffId, status) => {
    try {
      await api.post('/staff/attendance', {
        staff_id: staffId,
        date: attDate,
        status,
      });
      toast.success('Staff attendance saved');
      fetchAttendance();
    } catch (err) {
      toast.error('Failed to mark staff attendance');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Hostel Staff & Personnel Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Wardens, security personnel, maintenance electricians, plumbers, chefs & operational staff
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-500/25 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('directory')}
          className={`py-1.5 px-4 rounded-xl text-xs font-bold transition ${
            activeTab === 'directory'
              ? 'bg-primary-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Staff Directory ({staff.length})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-1.5 px-4 rounded-xl text-xs font-bold transition ${
            activeTab === 'attendance'
              ? 'bg-primary-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Staff Shift Attendance
        </button>
      </div>

      {/* Tab 1: Directory */}
      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {staff.map((s) => (
            <div key={s.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-primary-600 text-white font-black text-sm flex items-center justify-center">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{s.name}</h3>
                      <div className="text-[11px] font-semibold text-primary-600 dark:text-primary-400">{s.designation}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(s.status)}`}>
                    {s.status}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px]">ID: {s.staff_code}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-slate-400 capitalize">Shift: {s.shift}</span>
                  </div>
                  <div>Department: <b>{s.department}</b></div>
                  <div className="font-mono">{s.phone}</div>
                  <div className="text-[11px] text-slate-400 truncate">{s.email}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Monthly Compensation</span>
                <span className="font-black text-slate-900 dark:text-white">{formatCurrency(s.salary)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Staff Attendance */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <span className="text-xs font-bold">Shift Date:</span>
            <input
              type="date"
              value={attDate}
              onChange={(e) => setAttDate(e.target.value)}
              className="py-1 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Staff Member</th>
                  <th className="py-3.5 px-4">Role & ID</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-6 text-right">Quick Mark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendance.map((a) => (
                  <tr key={a.staff_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white">{a.name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{a.designation} ({a.staff_code})</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleMarkStaffAtt(a.staff_id, 'present')}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-bold text-[11px]"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleMarkStaffAtt(a.staff_id, 'absent')}
                          className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold text-[11px]"
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Enroll New Hostel Staff"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
              <select
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Warden">Hostel Warden</option>
                <option value="Senior Accountant">Accountant</option>
                <option value="Security Officer">Security Guard</option>
                <option value="Maintenance Electrician">Electrician</option>
                <option value="Maintenance Plumber">Plumber</option>
                <option value="Head Chef">Head Chef</option>
                <option value="Cleaning Staff">Cleaning Supervisor</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Salary ($)</label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {submitting ? 'Enrolling...' : 'Enroll Staff'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffDirectory;
