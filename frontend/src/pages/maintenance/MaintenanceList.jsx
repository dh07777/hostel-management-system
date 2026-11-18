import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters';
import Modal from '../../components/common/Modal';
import { Wrench, Plus, CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';

const MaintenanceList = () => {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Request Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'electrical',
    priority: 'medium',
    description: '',
    location_details: '',
    estimated_cost: 0,
    scheduled_date: '',
    assigned_to_staff_id: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Complete / Edit Request Modal state
  const [selectedReq, setSelectedReq] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    status: 'completed',
    actual_cost: 0,
    completion_notes: '',
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchStaff();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/maintenance/');
      setRequests(res.data || []);
    } catch (err) {
      toast.error('Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await api.get('/staff/');
      setStaffList(res.data || []);
    } catch (err) {}
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/maintenance/', formData);
      toast.success('Maintenance request created');
      setShowCreateModal(false);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (req) => {
    setSelectedReq(req);
    setEditData({
      status: req.status,
      actual_cost: req.actual_cost || req.estimated_cost,
      completion_notes: req.completion_notes || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.put(`/maintenance/${selectedReq.id}`, editData);
      toast.success('Maintenance record updated (expense synchronized)');
      setShowEditModal(false);
      fetchRequests();
    } catch (err) {
      toast.error('Failed to update maintenance request');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Facility Maintenance & Work Orders
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track repairs, contractor assignments, estimated vs actual costs & infrastructure upkeep
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/25 transition text-xs font-bold flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Work Order</span>
        </button>
      </div>

      {/* Work Orders List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading work orders...</div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No maintenance records logged.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Order Code</th>
                  <th className="py-3.5 px-4">Work Item</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Assigned Staff</th>
                  <th className="py-3.5 px-4">Estimated vs Actual</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900 dark:text-white">
                      {r.request_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{r.title}</div>
                      <div className="text-[11px] text-slate-500 capitalize">{r.category}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {r.location_details || (r.room_number ? `Room ${r.room_number}` : 'Common Facility')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : r.priority === 'high'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {r.assigned_staff_name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(r.actual_cost > 0 ? r.actual_cost : r.estimated_cost)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Est: {formatCurrency(r.estimated_cost)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => openEditModal(r)}
                        className="py-1 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-950 text-slate-700 dark:text-slate-300 hover:text-primary-600 rounded-lg font-bold text-xs transition"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Work Order Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Facility Work Order"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Work Order Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Corridor Lighting Replacement"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="carpentry">Carpentry</option>
                <option value="painting">Painting</option>
                <option value="appliance">Appliance</option>
                <option value="cleaning">Deep Cleaning</option>
                <option value="other">General Other</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Estimated Cost ($)</label>
              <input
                type="number"
                value={formData.estimated_cost}
                onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Scheduled Date</label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Location / Details</label>
            <input
              type="text"
              value={formData.location_details}
              onChange={(e) => setFormData({ ...formData, location_details: e.target.value })}
              placeholder="e.g. Emerald Tower, 2nd Floor Corridor"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Scope of Work *</label>
            <textarea
              rows={2}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Issue Work Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Work Order Modal */}
      {selectedReq && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`Update Order: ${selectedReq.request_code}`}
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="pending">Pending</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Actual Incurred Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editData.actual_cost}
                  onChange={(e) => setEditData({ ...editData, actual_cost: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Completion Notes / Contractor Invoicing</label>
              <textarea
                rows={3}
                value={editData.completion_notes}
                onChange={(e) => setEditData({ ...editData, completion_notes: e.target.value })}
                placeholder="Details of materials replaced, testing results..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Update Record'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MaintenanceList;
