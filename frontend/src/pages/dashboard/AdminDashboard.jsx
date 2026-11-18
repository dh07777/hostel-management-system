import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatsCard from '../../components/common/StatsCard';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters';
import {
  Users,
  DoorOpen,
  DollarSign,
  AlertCircle,
  Wrench,
  UserCheck,
  TrendingUp,
  FileText,
  Activity,
  ArrowRight,
  RefreshCw,
  Plus,
  Percent
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Link } from 'react-router-dom';

const COLORS = ['#006bc9', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0284c7'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activities, setActivities] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, chartsRes, actRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/charts'),
        api.get('/dashboard/recent-activities'),
      ]);
      setStats(statsRes.data);
      setCharts(chartsRes.data);
      setActivities(actRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm font-semibold text-slate-500">Loading Enterprise Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Hostel Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics, occupancy metrics, fiscal cash flow & hostel services
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
          <Link
            to="/admin/rooms"
            className="py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/25 transition text-xs font-bold flex items-center gap-2"
          >
            <DoorOpen className="w-4 h-4" />
            <span>Room Allocation</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Active Students"
          value={stats?.total_students || 0}
          icon={Users}
          color="blue"
          subtitle="Enrolled hostel residents"
          change="+12% this term"
          isPositive={true}
        />
        <StatsCard
          title="Room Occupancy"
          value={`${stats?.occupancy_percentage || 0}%`}
          icon={Percent}
          color="emerald"
          subtitle={`${stats?.occupied_beds || 0} / ${stats?.total_capacity || 0} beds filled`}
          change={`${stats?.available_beds || 0} beds free`}
          isPositive={true}
        />
        <StatsCard
          title="Monthly Collections"
          value={formatCurrency(stats?.monthly_revenue || 0)}
          icon={DollarSign}
          color="emerald"
          subtitle="Collected this billing cycle"
          change="92% fee collection"
          isPositive={true}
        />
        <StatsCard
          title="Pending Dues"
          value={formatCurrency(stats?.pending_payments || 0)}
          icon={AlertCircle}
          color="amber"
          subtitle="Unpaid student fee balance"
          change="Auto-reminders sent"
          isPositive={false}
        />
      </div>

      {/* Operational Highlights Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Available Rooms</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {stats?.available_rooms || 0}
            </div>
          </div>
          <DoorOpen className="w-7 h-7 text-primary-500/80" />
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Active Visitors</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {stats?.current_visitors || 0}
            </div>
          </div>
          <UserCheck className="w-7 h-7 text-emerald-500/80" />
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Open Complaints</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {stats?.open_complaints || 0}
            </div>
          </div>
          <AlertCircle className="w-7 h-7 text-amber-500/80" />
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Maintenance</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {stats?.maintenance_requests || 0}
            </div>
          </div>
          <Wrench className="w-7 h-7 text-purple-500/80" />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Expenses Chart (Span 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Revenue vs Operating Expenses
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Past 6-month fiscal trend</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              USD ($)
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.monthly_revenue_chart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`$${value.toFixed(2)}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" name="Fee Revenue" fill="#006bc9" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Expenditure" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Types Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Room Inventory Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Proportion by occupancy configuration</p>
          </div>

          <div className="h-60 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.room_types_chart || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="type"
                >
                  {(charts?.room_types_chart || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
            {(charts?.room_types_chart || []).map((r, i) => (
              <div key={r.type} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-slate-600 dark:text-slate-400 truncate">{r.type}: <b>{r.count}</b></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Breakdown Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Status Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Student Invoices Breakdown
          </h3>
          <div className="space-y-3">
            {(charts?.payment_status_chart || []).map((p) => (
              <div key={p.status} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{p.status}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeClass(p.status)}`}>
                  {p.count} invoices
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Complaints Categories */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Reported Maintenance Categories
          </h3>
          <div className="space-y-3">
            {(charts?.complaints_category_chart || []).map((c, i) => (
              <div key={c.category} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{c.category}</span>
                <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                  {c.count} tickets
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Admissions */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-600" />
              Latest Admission Applications
            </h3>
            <Link to="/admin/admissions" className="text-xs text-primary-600 font-bold hover:underline">
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activities?.recent_admissions?.map((app) => (
              <div key={app.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {app.full_name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {app.course} &bull; {app.application_number}
                  </div>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(app.status)}`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Recent Fee Payments
            </h3>
            <Link to="/admin/fees" className="text-xs text-primary-600 font-bold hover:underline">
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activities?.recent_payments?.map((pay) => (
              <div key={pay.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {pay.student_name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {pay.payment_method.toUpperCase()} &bull; {pay.transaction_reference}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(pay.amount)}
                  </div>
                  <div className="text-[10px] text-slate-400">{formatDate(pay.payment_date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
