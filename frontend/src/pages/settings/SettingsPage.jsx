import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatDateTime, formatCurrency } from '../../utils/formatters';
import Modal from '../../components/common/Modal';
import { Settings, Shield, Plus, DollarSign, Save, FileText } from 'lucide-react';

const SettingsPage = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('settings');
  const [settings, setSettings] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Expense Modal
  const [showExpModal, setShowExpModal] = useState(false);
  const [expData, setExpData] = useState({
    title: '',
    category: 'maintenance',
    amount: 150,
    paid_to: '',
    payment_method: 'bank_transfer',
    notes: '',
  });

  // Emergency Announcement Modal
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annData, setAnnData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    target_audience: 'all',
    is_emergency: false,
  });

  useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'settings') {
        const res = await api.get('/settings/');
        setSettings(res.data || {});
      } else if (activeTab === 'audit') {
        const res = await api.get('/settings/audit-logs?per_page=50');
        setAuditLogs(res.data.logs || []);
      } else if (activeTab === 'expenses') {
        const res = await api.get('/settings/expenses');
        setExpenses(res.data || []);
      }
    } catch (err) {
      toast.error('Failed to load configuration data');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.put('/settings/', settings);
      toast.success('System settings saved successfully');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/settings/expenses', expData);
      toast.success('Expense record created');
      setShowExpModal(false);
      fetchInitialData();
    } catch (err) {
      toast.error('Failed to create expense');
    }
  };

  const handleAnnounceSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notifications/announcements', annData);
      toast.success('Announcement broadcast published to users');
      setShowAnnModal(false);
    } catch (err) {
      toast.error('Failed to publish announcement');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Settings & Operational Controls
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            System configuration, organizational parameters, audit trail & expense management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnnModal(true)}
            className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition"
          >
            Broadcast Announcement
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('settings')}
          className={`py-1.5 px-4 rounded-xl text-xs font-bold transition ${
            activeTab === 'settings'
              ? 'bg-primary-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          General Parameters
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`py-1.5 px-4 rounded-xl text-xs font-bold transition ${
            activeTab === 'expenses'
              ? 'bg-primary-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Expense Registry ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`py-1.5 px-4 rounded-xl text-xs font-bold transition ${
            activeTab === 'audit'
              ? 'bg-primary-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Audit Trail Log
        </button>
      </div>

      {/* Tab 1: Settings Form */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSettingsSave} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
              Institution & Housing Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Hostel Entity Name</label>
                <input
                  type="text"
                  value={settings.hostel_name || ''}
                  onChange={(e) => setSettings({ ...settings, hostel_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Official Support Email</label>
                <input
                  type="email"
                  value={settings.support_email || ''}
                  onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
              Rules, Curfew & Billing Parameters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Night Curfew Gate Time</label>
                <input
                  type="text"
                  value={settings.default_check_in_curfew || '21:30'}
                  onChange={(e) => setSettings({ ...settings, default_check_in_curfew: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Daily Late Penalty ($)</label>
                <input
                  type="number"
                  value={settings.late_fee_per_day || '10'}
                  onChange={(e) => setSettings({ ...settings, late_fee_per_day: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Gateway Mode</label>
                <select
                  value={settings.payment_gateway_mode || 'test_sandbox'}
                  onChange={(e) => setSettings({ ...settings, payment_gateway_mode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="test_sandbox">Test Sandbox Mode (Mock Clearance)</option>
                  <option value="production">Production Live Mode</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="py-2.5 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Expense Registry */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowExpModal(true)}
              className="py-2 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Expense Code</th>
                  <th className="py-3.5 px-4">Title & Item</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Paid To</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900 dark:text-white">{e.expense_code}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{e.title}</td>
                    <td className="py-3.5 px-4 capitalize text-slate-500">{e.category.replace('_', ' ')}</td>
                    <td className="py-3.5 px-4 font-black text-rose-600">{formatCurrency(e.amount)}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{e.paid_to}</td>
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(e.expense_date)}</td>
                    <td className="py-3.5 px-4 text-slate-500">{e.approved_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Trail Log */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Module</th>
                <th className="py-3.5 px-4">Operator</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-6 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {auditLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-6 text-slate-400">{formatDateTime(l.created_at)}</td>
                  <td className="py-3.5 px-4 font-bold text-primary-600 dark:text-primary-400">{l.action}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">{l.module}</td>
                  <td className="py-3.5 px-4 font-sans font-medium text-slate-900 dark:text-white">{l.user_name}</td>
                  <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-400 max-w-xs truncate">{l.details}</td>
                  <td className="py-3.5 px-6 text-right text-slate-400">{l.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Expense Modal */}
      <Modal
        isOpen={showExpModal}
        onClose={() => setShowExpModal(false)}
        title="Record Operating Expenditure"
      >
        <form onSubmit={handleExpenseSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Expense Title *</label>
            <input
              type="text"
              required
              value={expData.title}
              onChange={(e) => setExpData({ ...expData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={expData.category}
                onChange={(e) => setExpData({ ...expData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="maintenance">Facility Maintenance</option>
                <option value="mess_grocery">Mess Grocery</option>
                <option value="electricity_bill">Electricity Utility Bill</option>
                <option value="water_bill">Water Supply Bill</option>
                <option value="cleaning_supplies">Sanitation Supplies</option>
                <option value="staff_salary">Staff Salary Disbursement</option>
                <option value="internet_cable">High-Speed Internet Cable</option>
                <option value="miscellaneous">Miscellaneous</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={expData.amount}
                onChange={(e) => setExpData({ ...expData, amount: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Vendor / Payee</label>
            <input
              type="text"
              required
              value={expData.paid_to}
              onChange={(e) => setExpData({ ...expData, paid_to: e.target.value })}
              placeholder="e.g. Metro Water Board or Contractor Ltd"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowExpModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold"
            >
              Save Expense
            </button>
          </div>
        </form>
      </Modal>

      {/* Broadcast Announcement Modal */}
      <Modal
        isOpen={showAnnModal}
        onClose={() => setShowAnnModal(false)}
        title="Broadcast Announcement"
      >
        <form onSubmit={handleAnnounceSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Announcement Subject *</label>
            <input
              type="text"
              required
              value={annData.title}
              onChange={(e) => setAnnData({ ...annData, title: e.target.value })}
              placeholder="e.g. Annual Sports Festival Schedule"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select
                value={annData.priority}
                onChange={(e) => setAnnData({ ...annData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="normal">Normal Information</option>
                <option value="high">High Importance</option>
                <option value="urgent">Urgent / Safety Alert</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Audience</label>
              <select
                value={annData.target_audience}
                onChange={(e) => setAnnData({ ...annData, target_audience: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="all">All Residents & Staff</option>
                <option value="student">Resident Students Only</option>
                <option value="warden">Hostel Wardens Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Content Body *</label>
            <textarea
              rows={3}
              required
              value={annData.content}
              onChange={(e) => setAnnData({ ...annData, content: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={annData.is_emergency}
              onChange={(e) => setAnnData({ ...annData, is_emergency: e.target.checked })}
              className="rounded text-rose-600 focus:ring-rose-500"
            />
            <span className="font-bold text-rose-600">Flash as Red Emergency Banner across all user headers</span>
          </label>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAnnModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold"
            >
              Publish Announcement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
