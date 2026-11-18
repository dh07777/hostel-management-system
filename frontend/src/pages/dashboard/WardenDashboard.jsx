import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatsCard from '../../components/common/StatsCard';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';
import {
  Users,
  CalendarCheck,
  PlaneTakeoff,
  UserCheck,
  MessageSquareWarning,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Plus,
  Search
} from 'lucide-react';
import { formatDate, getStatusBadgeClass } from '../../utils/formatters';

const WardenDashboard = () => {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWardenData();
  }, []);

  const fetchWardenData = async () => {
    setLoading(true);
    try {
      const [sumRes, leavesRes, visRes, cmpRes] = await Promise.all([
        api.get('/dashboard/warden-summary'),
        api.get('/leaves/?status=pending'),
        api.get('/visitors/active'),
        api.get('/complaints/?status=submitted'),
      ]);
      setSummary(sumRes.data);
      setPendingLeaves(leavesRes.data);
      setActiveVisitors(visRes.data);
      setRecentComplaints(cmpRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (id) => {
    try {
      await api.put(`/leaves/${id}/approve`, { approval_remarks: 'Approved by Warden on duty' });
      toast.success('Leave application approved');
      fetchWardenData();
    } catch (err) {
      toast.error('Failed to approve leave');
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      await api.put(`/leaves/${id}/reject`, { approval_remarks: 'Rejected by Warden' });
      toast.info('Leave application rejected');
      fetchWardenData();
    } catch (err) {
      toast.error('Failed to reject leave');
    }
  };

  const handleCheckoutVisitor = async (id) => {
    try {
      await api.put(`/visitors/${id}/checkout`);
      toast.success('Visitor checked out successfully');
      fetchWardenData();
    } catch (err) {
      toast.error('Failed to check out visitor');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchStudent.trim()) return;
    setSearching(true);
    try {
      const res = await api.get(`/students/?search=${encodeURIComponent(searchStudent.trim())}`);
      setSearchResults(res.data.students || []);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm font-semibold text-slate-500">Loading Warden Console...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Warden Control Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Student roll calls, gate passes, resident disciplinary records & leave approvals
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/attendance"
            className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20 transition text-xs font-bold flex items-center gap-2"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Mark Attendance</span>
          </Link>
          <Link
            to="/admin/visitors"
            className="py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition text-xs font-bold flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>Visitor Entry</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Residents"
          value={summary?.total_residents || 0}
          icon={Users}
          color="blue"
          subtitle="Enrolled hostel boarders"
        />
        <StatsCard
          title="Present Today"
          value={summary?.present_today || 0}
          icon={CalendarCheck}
          color="emerald"
          subtitle={`${summary?.absent_today || 0} absent &bull; ${summary?.leave_today || 0} on leave`}
        />
        <StatsCard
          title="Pending Leaves"
          value={summary?.pending_leaves || 0}
          icon={PlaneTakeoff}
          color="amber"
          subtitle="Awaiting warden authorization"
        />
        <StatsCard
          title="Active Visitors"
          value={summary?.current_visitors || 0}
          icon={UserCheck}
          color="purple"
          subtitle="Currently inside premises"
        />
      </div>

      {/* Quick Resident Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
          Quick Resident Search & Verification
        </h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              placeholder="Search by student name, ID code (e.g. STU20250001), room, or phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 dark:text-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {searchResults.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {s.full_name} <span className="text-slate-400 font-mono">({s.student_id_code})</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Room: <b>{s.current_room_number || 'Unassigned'}</b> ({s.current_bed_number || '-'}) &bull; Phone: {s.phone} &bull; Parent Contact: {s.emergency_contact_phone}
                  </div>
                </div>
                <Link
                  to={`/admin/students/${s.id}`}
                  className="text-xs font-bold text-primary-600 hover:underline"
                >
                  View Full Dossier
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Columns: Pending Leaves & Active Visitors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leaves Queue */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlaneTakeoff className="w-5 h-5 text-amber-500" />
                Pending Leave Applications ({pendingLeaves.length})
              </h3>
              <Link to="/admin/leaves" className="text-xs text-primary-600 font-bold hover:underline">
                View all
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingLeaves.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No pending leave applications requiring approval.
                </div>
              ) : (
                pendingLeaves.slice(0, 4).map((l) => (
                  <div key={l.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {l.student_name} <span className="text-slate-400 font-normal">({l.room_number || 'No Room'})</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {l.leave_type}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      &ldquo;{l.reason}&rdquo;
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>From: <b>{formatDate(l.from_date)}</b> &rarr; <b>{formatDate(l.to_date)}</b></span>
                      <span>Parent: <b>{l.parent_phone}</b></span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleApproveLeave(l.id)}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectLeave(l.id)}
                        className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Active Visitors Inside Hostel */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-500" />
                Currently Checked-In Visitors ({activeVisitors.length})
              </h3>
              <Link to="/admin/visitors" className="text-xs text-primary-600 font-bold hover:underline">
                Pass Log
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeVisitors.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No active visitors logged inside the hostel at this time.
                </div>
              ) : (
                activeVisitors.slice(0, 4).map((v) => (
                  <div key={v.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {v.visitor_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Visiting: <b>{v.student_name}</b> (Room {v.room_number || '-'})
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Purpose: {v.purpose} &bull; Check-In: {new Date(v.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <button
                      onClick={() => handleCheckoutVisitor(v.id)}
                      className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition shrink-0"
                    >
                      Check Out
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WardenDashboard;
