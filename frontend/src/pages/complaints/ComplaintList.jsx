import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatDateTime, getStatusBadgeClass } from '../../utils/formatters';
import Modal from '../../components/common/Modal';
import {
  MessageSquareWarning,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertTriangle,
  Star
} from 'lucide-react';

const ComplaintList = () => {
  const toast = useToast();
  const [complaints, setComplaints] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Status Update Modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusData, setStatusData] = useState({
    status: 'in_progress',
    assigned_to_staff_id: '',
    comment: 'Status updated by admin',
    resolution_notes: '',
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchComplaints();
    fetchStaff();
  }, [categoryFilter, statusFilter]);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/staff/');
      setStaffList(res.data || []);
    } catch (err) {}
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/complaints/?${params.toString()}`);
      setComplaints(res.data || []);
    } catch (err) {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (complaint) => {
    setSelectedComplaint(complaint);
    setStatusData({
      status: complaint.status,
      assigned_to_staff_id: complaint.assigned_to_staff_id || '',
      comment: 'Status updated by hostel staff',
      resolution_notes: complaint.resolution_notes || '',
    });
    setShowStatusModal(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setUpdatingStatus(true);
    try {
      await api.put(`/complaints/${selectedComplaint.id}/status`, statusData);
      toast.success('Complaint status updated successfully');
      setShowStatusModal(false);
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update complaint');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Complaint & Service Desk
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track student maintenance requests, prioritize electrical/plumbing repairs & log resolutions
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium dark:text-white"
          >
            <option value="">All Categories</option>
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No complaints matching filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Ticket Code</th>
                  <th className="py-3.5 px-4">Student & Room</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Title & Description</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Assigned Staff</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900 dark:text-white">
                      {c.complaint_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{c.student_name}</div>
                      <div className="text-[10px] text-slate-400">Room {c.room_number || 'Unassigned'}</div>
                    </td>
                    <td className="py-3.5 px-4 capitalize font-medium text-slate-600 dark:text-slate-300">
                      {c.category.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{c.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{c.description}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : c.priority === 'high'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {c.assigned_staff_name || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => openStatusModal(c)}
                        className="py-1 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-950 text-slate-700 dark:text-slate-300 hover:text-primary-600 rounded-lg font-bold text-xs transition"
                      >
                        Manage Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manage Status & Staff Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          title={`Manage Ticket: ${selectedComplaint.complaint_code}`}
        >
          <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">{selectedComplaint.title}</div>
              <p className="text-slate-500 text-[11px]">{selectedComplaint.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Update Status</label>
                <select
                  value={statusData.status}
                  onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assign to Staff</label>
                <select
                  value={statusData.assigned_to_staff_id}
                  onChange={(e) => setStatusData({ ...statusData, assigned_to_staff_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="">Unassigned</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.designation})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status Update Comment</label>
              <input
                type="text"
                value={statusData.comment}
                onChange={(e) => setStatusData({ ...statusData, comment: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            {statusData.status === 'resolved' && (
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Resolution Summary</label>
                <textarea
                  rows={2}
                  required
                  value={statusData.resolution_notes}
                  onChange={(e) => setStatusData({ ...statusData, resolution_notes: e.target.value })}
                  placeholder="Detail the repair work performed..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingStatus}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : 'Save Updates'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ComplaintList;
