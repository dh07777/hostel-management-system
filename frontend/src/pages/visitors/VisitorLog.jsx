import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatDateTime, getStatusBadgeClass } from '../../utils/formatters';
import Modal from '../../components/common/Modal';
import { UserCheck, Plus, Search, LogOut, ShieldAlert } from 'lucide-react';

const VisitorLog = () => {
  const toast = useToast();
  const [visitors, setVisitors] = useState([]);
  const [students, setStudents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // New Visitor Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    visitor_name: '',
    phone: '',
    id_proof_type: 'National ID',
    id_proof_number: '',
    student_id: '',
    purpose: '',
    vehicle_number: '',
    remarks: '',
  });
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchVisitors();
    fetchStudents();
  }, [statusFilter]);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students/?status=active&per_page=100');
      setStudents(res.data.students || []);
    } catch (err) {}
  };

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/visitors/?status=${statusFilter}` : '/visitors/';
      const res = await api.get(url);
      setVisitors(res.data || []);
    } catch (err) {
      toast.error('Failed to load visitor records');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (id, name) => {
    try {
      await api.put(`/visitors/${id}/checkout`);
      toast.success(`Visitor ${name} checked out`);
      fetchVisitors();
    } catch (err) {
      toast.error('Failed to check out visitor');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_id) {
      toast.error('Please select the resident student being visited');
      return;
    }
    setRegistering(true);
    try {
      await api.post('/visitors/', formData);
      toast.success('Visitor registered & entry pass granted');
      setShowModal(false);
      setFormData({
        visitor_name: '',
        phone: '',
        id_proof_type: 'National ID',
        id_proof_number: '',
        student_id: '',
        purpose: '',
        vehicle_number: '',
        remarks: '',
      });
      fetchVisitors();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Security Gate & Visitor Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Log visitor ingress & egress, vehicle verification & resident security clearance
          </p>
        </div>

        <button
          onClick={() => {
            if (students.length > 0) {
              setFormData((prev) => ({ ...prev, student_id: students[0].id }));
            }
            setShowModal(true);
          }}
          className="py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/25 transition text-xs font-bold flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Visitor Check-In</span>
        </button>
      </div>

      {/* Filter tab */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setStatusFilter('')}
          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition ${
            statusFilter === ''
              ? 'bg-primary-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Passes ({visitors.length})
        </button>
        <button
          onClick={() => setStatusFilter('checked_in')}
          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition ${
            statusFilter === 'checked_in'
              ? 'bg-primary-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Currently Inside Premises
        </button>
        <button
          onClick={() => setStatusFilter('checked_out')}
          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition ${
            statusFilter === 'checked_out'
              ? 'bg-primary-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Departed (Checked Out)
        </button>
      </div>

      {/* Visitors List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading visitor logs...</div>
        ) : visitors.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No visitor records matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Visitor Details</th>
                  <th className="py-3.5 px-4">Resident Visited</th>
                  <th className="py-3.5 px-4">Room</th>
                  <th className="py-3.5 px-4">Purpose</th>
                  <th className="py-3.5 px-4">ID Proof</th>
                  <th className="py-3.5 px-4">Check-In Time</th>
                  <th className="py-3.5 px-4">Check-Out Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visitors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-slate-900 dark:text-white">{v.visitor_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{v.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{v.student_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{v.student_id_code}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-primary-600 dark:text-primary-400">
                      {v.room_number ? `Room ${v.room_number}` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {v.purpose}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {v.id_proof_type}: {v.id_proof_number || 'Verified'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {formatDateTime(v.check_in_time)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {v.check_out_time ? formatDateTime(v.check_out_time) : <span className="text-amber-600 font-bold">Active Inside</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(v.status)}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {v.status === 'checked_in' && (
                        <button
                          onClick={() => handleCheckout(v.id, v.visitor_name)}
                          className="py-1 px-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/60 rounded-lg font-bold text-xs transition inline-flex items-center gap-1"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Check Out</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visitor Check-In Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Register Visitor Check-In"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Visitor Full Name *</label>
              <input
                type="text"
                required
                value={formData.visitor_name}
                onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Phone *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Resident Student Being Visited *</label>
            <select
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.student_id_code}) &bull; Room {s.current_room_number || 'N/A'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ID Proof Type</label>
              <select
                value={formData.id_proof_type}
                onChange={(e) => setFormData({ ...formData, id_proof_type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="National ID">National ID Card</option>
                <option value="Driver License">Driver's License</option>
                <option value="Passport">Passport</option>
                <option value="University ID">University Staff/Student ID</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ID Proof Number</label>
              <input
                type="text"
                value={formData.id_proof_number}
                onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })}
                placeholder="e.g. DL-98124"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Purpose of Visit *</label>
              <input
                type="text"
                required
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="e.g. Weekend family visit"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Vehicle License Plate</label>
              <input
                type="text"
                value={formData.vehicle_number}
                onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                placeholder="Optional vehicle #"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registering}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {registering ? 'Checking In...' : 'Authorize Check-In'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VisitorLog;
