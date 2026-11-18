import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, formatDateTime, getStatusBadgeClass } from '../../utils/formatters';
import {
  User,
  DoorOpen,
  CreditCard,
  CalendarCheck,
  MessageSquareWarning,
  PlaneTakeoff,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Upload,
  ArrowLeft,
  FileDown
} from 'lucide-react';

const StudentDetail = () => {
  const { id } = useParams();
  const toast = useToast();
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchStudentDetail();
  }, [id]);

  const fetchStudentDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/students/${id}`);
      setStudent(res.data);
    } catch (err) {
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await api.post(`/students/${id}/upload-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Photo uploaded successfully');
      setStudent((prev) => ({ ...prev, photo_url: res.data.photo_url }));
    } catch (err) {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm font-semibold text-slate-500">Loading Student Dossier...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-bold text-slate-800">Student not found</h3>
        <Link to="/admin/students" className="text-sm text-primary-600 font-bold hover:underline mt-2 inline-block">
          Return to Student Directory
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview & Bio', icon: User },
    { id: 'room', name: 'Room & Allocations', icon: DoorOpen },
    { id: 'finance', name: 'Invoices & Payments', icon: CreditCard },
    { id: 'attendance', name: 'Attendance Record', icon: CalendarCheck },
    { id: 'complaints', name: 'Complaints', icon: MessageSquareWarning },
    { id: 'leaves', name: 'Leave Requests', icon: PlaneTakeoff },
    { id: 'visitors', name: 'Visitor Passes', icon: UserCheck },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top back navigation */}
      <div>
        <Link
          to="/admin/students"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students Directory
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center overflow-hidden shadow-lg shadow-primary-500/20 shrink-0">
              {student.photo_url ? (
                <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
              ) : (
                student.first_name.charAt(0)
              )}
            </div>
            <label className="absolute inset-0 bg-slate-950/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition text-[10px] font-bold">
              <Upload className="w-4 h-4 mb-0.5" />
              {uploading ? '...' : 'Upload'}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {student.full_name}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(student.status)}`}>
                {student.status}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
                {student.student_id_code}
              </span>
              <span>{student.course} ({student.department})</span>
              <span>{student.academic_year}</span>
            </div>
          </div>
        </div>

        {/* Room pill */}
        <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800">
          <div className="text-[10px] uppercase font-bold text-primary-600 dark:text-primary-400 tracking-wider">
            Current Accommodation
          </div>
          <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
            {student.current_room_number ? (
              <>Room {student.current_room_number} &bull; {student.current_bed_number}</>
            ) : (
              <span className="italic text-slate-400">No active room allocated</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {student.building_name || 'Grand Horizon Campus'}
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex overflow-x-auto gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isActive
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Bio */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Email Address</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{student.email}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Mobile Phone</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{student.phone}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Gender</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 capitalize">{student.gender}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Blood Group</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{student.blood_group || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Date of Birth</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{formatDate(student.date_of_birth)}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Hostel Joining Date</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{formatDate(student.joining_date)}</p>
              </div>
            </div>
            <div className="text-xs pt-2">
              <span className="text-slate-400 font-medium">Permanent Address</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{student.address || 'N/A'}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              Parent & Guardian Information
            </h3>
            {student.parent_info ? (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Father's Name</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{student.parent_info.father_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Father's Phone</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{student.parent_info.father_phone || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Mother's Name</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{student.parent_info.mother_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Emergency Contact</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {student.emergency_contact_name} ({student.emergency_contact_phone})
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-6 text-center">No parent records attached.</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Room & Allocation History */}
      {activeTab === 'room' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
            Room Allocation History
          </h3>
          <div className="space-y-3">
            {student.allocation_history?.map((a) => (
              <div key={a.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Room {a.room_number} &bull; {a.bed_number}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Allocated: {formatDate(a.allocation_date)} &bull; {a.vacating_date ? `Vacated: ${formatDate(a.vacating_date)}` : 'Active'}
                  </div>
                  {a.remarks && <div className="text-[11px] text-slate-400 mt-0.5">Remarks: {a.remarks}</div>}
                </div>
                <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(a.status)}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Finance (Invoices & Payments) */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Issued Fee Invoices
            </h3>
            <div className="space-y-3">
              {student.invoices?.map((inv) => (
                <div key={inv.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {inv.title} <span className="text-slate-400">({inv.invoice_number})</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Total: {formatCurrency(inv.total_amount)} &bull; Paid: {formatCurrency(inv.paid_amount)} &bull; Balance: <b>{formatCurrency(inv.balance_amount)}</b>
                    </div>
                    <div className="text-[10px] text-slate-400">Due: {formatDate(inv.due_date)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(inv.status)}`}>
                      {inv.status}
                    </span>
                    <a
                      href={`/api/fees/invoices/${inv.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 hover:bg-primary-100 transition"
                      title="Download PDF Invoice"
                    >
                      <FileDown className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Attendance Record */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Attendance Log
            </h3>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
              {student.attendance_summary?.percentage}% Attendance
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {student.attendance_summary?.recent_records?.map((att) => (
              <div key={att.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(att.date)}</span>
                  {att.remarks && <span className="text-slate-400 ml-2">({att.remarks})</span>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(att.status)}`}>
                  {att.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Complaints */}
      {activeTab === 'complaints' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
            Reported Complaints & Service Requests
          </h3>
          <div className="space-y-3">
            {student.complaints?.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {c.title} <span className="text-slate-400 font-mono">({c.complaint_code})</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(c.status)}`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{c.description}</p>
                {c.resolution_notes && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] mt-2">
                    <b>Resolution:</b> {c.resolution_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Leaves */}
      {activeTab === 'leaves' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
            Leave Applications History
          </h3>
          <div className="space-y-3">
            {student.leaves?.map((l) => (
              <div key={l.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {formatDate(l.from_date)} &rarr; {formatDate(l.to_date)} ({l.leave_type})
                  </div>
                  <div className="text-slate-500 mt-0.5">{l.reason}</div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(l.status)}`}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Visitors */}
      {activeTab === 'visitors' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
            Hostel Visitor Log
          </h3>
          <div className="space-y-3">
            {student.visitors?.map((v) => (
              <div key={v.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{v.visitor_name} ({v.phone})</div>
                  <div className="text-slate-500 mt-0.5">Purpose: {v.purpose} &bull; In: {formatDateTime(v.check_in_time)}</div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(v.status)}`}>
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetail;
