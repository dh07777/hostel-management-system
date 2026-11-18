import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDate, getStatusBadgeClass } from '../../utils/formatters';
import { PlaneTakeoff, CheckCircle2, XCircle, Clock, UserCheck } from 'lucide-react';

const LeaveList = () => {
  const toast = useToast();
  const [leaves, setLeaves] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/leaves/?status=${statusFilter}` : '/leaves/';
      const res = await api.get(url);
      setLeaves(res.data || []);
    } catch (err) {
      toast.error('Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, code) => {
    try {
      await api.put(`/leaves/${id}/approve`, { approval_remarks: 'Approved by Warden on duty' });
      toast.success(`Leave ${code} approved`);
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to approve leave');
    }
  };

  const handleReject = async (id, code) => {
    try {
      await api.put(`/leaves/${id}/reject`, { approval_remarks: 'Academic commitment / incomplete consent' });
      toast.info(`Leave ${code} rejected`);
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to reject leave');
    }
  };

  const handleConfirmReturn = async (id, code) => {
    try {
      await api.put(`/leaves/${id}/return`);
      toast.success(`Student return recorded for ${code}`);
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to confirm return');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Resident Leave & Outpass Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Parent-consented night passes, vacation travel permits & safe hostel return verification
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setStatusFilter('')}
          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition ${
            statusFilter === ''
              ? 'bg-primary-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Applications ({leaves.length})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition ${
            statusFilter === 'pending'
              ? 'bg-amber-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition ${
            statusFilter === 'approved'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Approved & Active
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition ${
            statusFilter === 'completed'
              ? 'bg-purple-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Completed (Returned)
        </button>
      </div>

      {/* Leaves List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading leave requests...</div>
        ) : leaves.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No leave applications found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Leave Pass #</th>
                  <th className="py-3.5 px-4">Resident</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Travel Duration</th>
                  <th className="py-3.5 px-4">Parent Contact</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900 dark:text-white">
                      {l.leave_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{l.student_name}</div>
                      <div className="text-[10px] text-slate-400">Room {l.room_number || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4 capitalize font-semibold text-slate-700 dark:text-slate-300">
                      {l.leave_type}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {formatDate(l.from_date)} &rarr; {formatDate(l.to_date)}
                      </div>
                      {l.actual_return_date && (
                        <div className="text-[10px] text-emerald-600">Returned: {formatDate(l.actual_return_date)}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {l.parent_phone}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs text-slate-600 dark:text-slate-300 truncate">
                      {l.reason}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(l.status)}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {l.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(l.id, l.leave_code)}
                              className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(l.id, l.leave_code)}
                              className="py-1 px-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold text-[11px] transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {l.status === 'approved' && (
                          <button
                            onClick={() => handleConfirmReturn(l.id, l.leave_code)}
                            className="py-1 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[11px] transition"
                          >
                            Confirm Return
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveList;
