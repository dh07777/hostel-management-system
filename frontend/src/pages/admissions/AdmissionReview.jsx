import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDate, getStatusBadgeClass } from '../../utils/formatters';
import Modal from '../../components/common/Modal';
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  User,
  Phone,
  Mail,
  GraduationCap
} from 'lucide-react';

const AdmissionReview = () => {
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [status]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/admissions/?${params.toString()}`);
      setApplications(res.data || []);
    } catch (err) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setProcessing(true);
    try {
      const res = await api.put(`/admissions/${id}/approve`, {
        admin_remarks: reviewRemarks || 'Application verified and approved for room boarding.',
      });
      toast.success(res.data.message || 'Application approved! Student profile generated.');
      setShowDetailModal(false);
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id) => {
    setProcessing(true);
    try {
      await api.put(`/admissions/${id}/reject`, {
        admin_remarks: reviewRemarks || 'Capacity constraints or incomplete academic eligibility.',
      });
      toast.info('Application rejected');
      setShowDetailModal(false);
      fetchApplications();
    } catch (err) {
      toast.error('Failed to reject');
    } finally {
      setProcessing(false);
    }
  };

  const handleWaitlist = async (id) => {
    try {
      await api.put(`/admissions/${id}/waitlist`);
      toast.warning('Application moved to waiting list');
      setShowDetailModal(false);
      fetchApplications();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Admission Applications & Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review incoming student boarding applications, verify eligibility, and enroll residents
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setStatus('');
              setSearch('');
              fetchApplications();
            }}
            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchApplications()}
            placeholder="Search by candidate name, application #, email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 dark:text-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium dark:text-white"
          >
            <option value="">All Applications</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading admission queue...</div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No admission applications found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">App Number</th>
                  <th className="py-3.5 px-4">Applicant</th>
                  <th className="py-3.5 px-4">Course & Dept</th>
                  <th className="py-3.5 px-4">Room Pref</th>
                  <th className="py-3.5 px-4">Parent Phone</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 font-mono font-bold text-primary-600 dark:text-primary-400">
                      {app.application_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{app.full_name}</div>
                      <div className="text-[11px] text-slate-400">{app.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      <div>{app.course}</div>
                      <div className="text-[10px] text-slate-400">{app.department}</div>
                    </td>
                    <td className="py-3.5 px-4 capitalize font-semibold text-slate-700 dark:text-slate-300">
                      {app.preferred_room_type.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {app.parent_phone || app.phone}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDate(app.created_at)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setReviewRemarks(app.admin_remarks || '');
                          setShowDetailModal(true);
                        }}
                        className="py-1 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-950/60 text-slate-700 dark:text-slate-300 hover:text-primary-600 rounded-lg font-bold text-xs transition"
                      >
                        Inspect & Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Details Modal */}
      {selectedApp && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Application Details - ${selectedApp.application_number}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Status Header */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold">Current Status:</span>
                <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(selectedApp.status)}`}>
                  {selectedApp.status}
                </span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Applied: {formatDate(selectedApp.created_at)}
              </div>
            </div>

            {/* Candidate details */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 font-medium">Applicant Full Name</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedApp.full_name}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Contact Phone</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedApp.phone}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Email Address</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedApp.email}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Gender & Blood Group</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5 capitalize">{selectedApp.gender} &bull; {selectedApp.blood_group || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Academic Program</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedApp.course} ({selectedApp.department})</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Preferred Room Category</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5 capitalize">{selectedApp.preferred_room_type.replace('_', ' ')}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 font-medium">Parent / Emergency Contact</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {selectedApp.parent_name} ({selectedApp.parent_phone})
                </p>
              </div>
            </div>

            {/* Remarks input */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Admin Evaluation Notes / Remarks:
              </label>
              <textarea
                rows={2}
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                placeholder="Enter approval conditions or rejection grounds..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleWaitlist(selectedApp.id)}
                className="px-3 py-2 rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold hover:bg-amber-100"
              >
                Move to Waitlist
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleReject(selectedApp.id)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition disabled:opacity-50"
                >
                  Reject Application
                </button>
                <button
                  type="button"
                  disabled={processing || selectedApp.status === 'approved'}
                  onClick={() => handleApprove(selectedApp.id)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Enroll</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdmissionReview;
