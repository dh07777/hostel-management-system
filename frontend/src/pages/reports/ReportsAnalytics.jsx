import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Printer,
  Download,
  Users,
  DoorOpen,
  DollarSign,
  CalendarCheck,
  MessageSquareWarning,
  UserCheck
} from 'lucide-react';

const ReportsAnalytics = () => {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/summary');
      setSummary(res.data);
    } catch (err) {
      toast.error('Failed to load reports summary');
    } finally {
      setLoading(false);
    }
  };

  const reportItems = [
    { type: 'students', title: 'Student Admission & Roster Report', desc: 'Active student profiles, courses, departments & allocated rooms', icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60' },
    { type: 'occupancy', title: 'Room Occupancy & Capacity Report', desc: 'Bed inventory, free vs occupied capacity & building distributions', icon: DoorOpen, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' },
    { type: 'payments', title: 'Fee Collection & Transaction Report', desc: 'Audited student payments, gateways & reconciliation references', icon: DollarSign, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/60' },
    { type: 'invoices', title: 'Outstanding Due & Balance Report', desc: 'Overdue invoices, unpaid dues, penalty assessments & balances', icon: FileText, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' },
    { type: 'expenses', title: 'Hostel Expenditures & Purchases', desc: 'Maintenance invoices, grocery orders, utility bills & salaries', icon: BarChart3, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' },
    { type: 'attendance', title: 'Student Attendance & Roll Call Logs', desc: 'Historical daily roll call records, absence rates & leaves', icon: CalendarCheck, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60' },
    { type: 'complaints', title: 'Complaints & Maintenance Log', desc: 'Reported repair tickets, resolution notes & contractor assignments', icon: MessageSquareWarning, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60' },
    { type: 'visitors', title: 'Security Gate & Visitor Passes', desc: 'Entry/exit logs, ID verifications & duration on campus', icon: UserCheck, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/60' },
  ];

  const handleExport = (type, format) => {
    const token = localStorage.getItem('token');
    const url = `/api/reports/export?type=${type}&format=${format}`;
    
    // Trigger direct download
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Export error');
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(`Downloaded ${type.toUpperCase()} ${format.toUpperCase()} report`);
      })
      .catch(() => {
        toast.error('Failed to export report');
      });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Reports & Fiscal Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate standardized PDF summaries, Excel spreadsheets (.xlsx), and raw CSV extracts
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print Summary Page</span>
        </button>
      </div>

      {/* Aggregate metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Revenue Collected</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(summary?.total_revenue || 0)}</div>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Outstanding Balance</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{formatCurrency(summary?.total_outstanding || 0)}</div>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Operating Expenses</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(summary?.total_expenses || 0)}</div>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Campus Occupancy Rate</div>
          <div className="text-2xl font-black text-primary-600 mt-1">{summary?.occupancy_rate || 0}%</div>
        </div>
      </div>

      {/* Report Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reportItems.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.type}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-primary-300 dark:hover:border-primary-800 transition"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${r.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{r.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.desc}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Export Formats:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExport(r.type, 'excel')}
                    className="py-1.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => handleExport(r.type, 'csv')}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportsAnalytics;
