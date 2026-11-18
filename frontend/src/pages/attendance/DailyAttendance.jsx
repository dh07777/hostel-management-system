import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const DailyAttendance = () => {
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/?date=${selectedDate}`);
      setRecords(res.data || []);
    } catch (err) {
      toast.error('Failed to load attendance list');
    } finally {
      setLoading(false);
    }
  };

  const setAllStatus = (newStatus) => {
    setRecords((prev) =>
      prev.map((r) => ({
        ...r,
        status: newStatus,
      }))
    );
  };

  const toggleSingleStatus = (studentId, status) => {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, status } : r))
    );
  };

  const handleSaveBulk = async () => {
    setSaving(true);
    try {
      const payload = {
        date: selectedDate,
        records: records.map((r) => ({
          student_id: r.student_id,
          status: r.status === 'unmarked' ? 'present' : r.status,
          remarks: r.remarks,
        })),
      };
      const res = await api.post('/attendance/bulk-mark', payload);
      toast.success(res.data.message || 'Attendance records committed successfully');
      fetchAttendance();
    } catch (err) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const totalCount = records.length;
  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const leaveCount = records.filter((r) => r.status === 'on_leave').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Daily Attendance & Roll Call
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bulk evening roll-call verification, curfew compliance & absence tracking
          </p>
        </div>

        <button
          onClick={handleSaveBulk}
          disabled={saving || records.length === 0}
          className="py-2.5 px-6 rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/25 transition text-xs font-bold flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Committed...' : 'Save & Submit Roll Call'}</span>
        </button>
      </div>

      {/* Date & Quick Batch Controls */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
          />
        </div>

        {/* Quick batch buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Mark All:</span>
          <button
            onClick={() => setAllStatus('present')}
            className="py-1.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs hover:bg-emerald-100 transition"
          >
            All Present
          </button>
          <button
            onClick={() => setAllStatus('absent')}
            className="py-1.5 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs hover:bg-rose-100 transition"
          >
            All Absent
          </button>
        </div>
      </div>

      {/* Metric counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Enrolled</div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{totalCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] uppercase font-bold text-emerald-600">Present</div>
          <div className="text-xl font-extrabold text-emerald-600 mt-0.5">{presentCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] uppercase font-bold text-rose-600">Absent</div>
          <div className="text-xl font-extrabold text-rose-600 mt-0.5">{absentCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] uppercase font-bold text-purple-600">On Authorized Leave</div>
          <div className="text-xl font-extrabold text-purple-600 mt-0.5">{leaveCount}</div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading daily roll call...</div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No active students found to take attendance.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Student</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Room Number</th>
                  <th className="py-3.5 px-4 text-center">Attendance Status</th>
                  <th className="py-3.5 px-6">Remarks / Observation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((r) => (
                  <tr key={r.student_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white">
                      {r.student_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-500">
                      {r.student_id_code}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-primary-600 dark:text-primary-400">
                      {r.room_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleSingleStatus(r.student_id, 'present')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            r.status === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSingleStatus(r.student_id, 'absent')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            r.status === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Absent
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSingleStatus(r.student_id, 'on_leave')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            r.status === 'on_leave'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-50 hover:text-purple-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          On Leave
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <input
                        type="text"
                        value={r.remarks || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRecords((prev) =>
                            prev.map((item) =>
                              item.student_id === r.student_id ? { ...item, remarks: val } : item
                            )
                          );
                        }}
                        placeholder="Optional remarks..."
                        className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
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

export default DailyAttendance;
