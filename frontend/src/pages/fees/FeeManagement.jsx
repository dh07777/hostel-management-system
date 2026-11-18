import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, formatDateTime, getStatusBadgeClass } from '../../utils/formatters';
import Modal from '../../components/common/Modal';
import {
  CreditCard,
  Plus,
  FileDown,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
  Filter
} from 'lucide-react';

const FeeManagement = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [structures, setStructures] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Create Invoice Modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    student_id: '',
    title: 'Monthly Hostel & Utility Dues',
    fee_type: 'monthly',
    amount: 320,
    discount_amount: 0,
    late_fee: 0,
    due_date: '',
    billing_month: 'December',
    billing_year: 2025,
    notes: 'Standard residential invoice',
  });
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Record Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    invoice_id: '',
    student_id: '',
    amount: 0,
    payment_method: 'online',
    payment_gateway: 'mock_gateway',
    notes: 'Online test gateway payment',
  });
  const [recordingPayment, setRecordingPayment] = useState(false);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const invUrl = statusFilter ? `/fees/invoices?status=${statusFilter}` : '/fees/invoices';
      const [invRes, payRes, strRes, stuRes] = await Promise.all([
        api.get(invUrl),
        api.get('/fees/payments'),
        api.get('/fees/structures'),
        api.get('/students/?status=active&per_page=100'),
      ]);
      setInvoices(invRes.data || []);
      setPayments(payRes.data || []);
      setStructures(strRes.data || []);
      setStudents(stuRes.data.students || []);
    } catch (err) {
      toast.error('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceData.student_id) {
      toast.error('Please select a student');
      return;
    }
    setCreatingInvoice(true);
    try {
      await api.post('/fees/invoices', invoiceData);
      toast.success('Invoice generated successfully');
      setShowInvoiceModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setCreatingInvoice(false);
    }
  };

  const openPaymentModal = (invoice) => {
    setPaymentData({
      invoice_id: invoice.id,
      student_id: invoice.student_id,
      amount: invoice.balance_amount > 0 ? invoice.balance_amount : invoice.total_amount,
      payment_method: 'online',
      payment_gateway: 'mock_gateway',
      notes: `Fee payment for ${invoice.invoice_number}`,
    });
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setRecordingPayment(true);
    try {
      const res = await api.post('/fees/payments', paymentData);
      toast.success(res.data.message || 'Payment recorded successfully');
      setShowPaymentModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setRecordingPayment(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Fee & Billing Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Hostel boarding invoices, fee structures, receipts & gateway transaction auditing
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (students.length > 0) {
                setInvoiceData((prev) => ({ ...prev, student_id: students[0].id }));
              }
              setShowInvoiceModal(true);
            }}
            className="py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/25 transition text-xs font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Invoice</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-3 px-5 text-xs font-bold border-b-2 transition ${
              activeTab === 'invoices'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Student Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 px-5 text-xs font-bold border-b-2 transition ${
              activeTab === 'payments'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Payment Receipts ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('structures')}
            className={`py-3 px-5 text-xs font-bold border-b-2 transition ${
              activeTab === 'structures'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Fee Structure Plans ({structures.length})
          </button>
        </div>

        {activeTab === 'invoices' && (
          <div className="flex items-center gap-2 pb-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
            >
              <option value="">All Invoices</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">No invoices found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-6">Invoice #</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Total</th>
                    <th className="py-3.5 px-4">Paid</th>
                    <th className="py-3.5 px-4">Balance</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-900 dark:text-white">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{inv.student_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{inv.student_id_code}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {inv.title}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(inv.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(inv.paid_amount)}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(inv.balance_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(inv.due_date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.balance_amount > 0 && (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-xs transition"
                            >
                              Collect Fee
                            </button>
                          )}
                          <a
                            href={`/api/fees/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                            title="Download PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {payments.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">No payment receipts found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-6">Receipt #</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Transaction Ref</th>
                    <th className="py-3.5 px-4">Gateway</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-6 text-right">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-900 dark:text-white">
                        {p.payment_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{p.student_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.student_id_code}</div>
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3.5 px-4 capitalize font-semibold text-slate-700 dark:text-slate-300">
                        {p.payment_method.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {p.transaction_reference}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-500">
                        {p.payment_gateway}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {formatDateTime(p.payment_date)}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <a
                          href={`/api/fees/payments/${p.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition inline-block"
                          title="Download Receipt PDF"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Fee Structures */}
      {activeTab === 'structures' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {structures.map((s) => (
            <div key={s.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-primary-600 dark:text-primary-400">
                    {s.fee_type}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600">
                    {s.room_type}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{s.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{s.description || 'Standard institutional billing rate'}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(s.amount)}</span>
                <span className="text-[11px] text-slate-400">Late: ${s.late_penalty_per_day}/day</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        title="Generate Student Invoice"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Student *</label>
            <select
              value={invoiceData.student_id}
              onChange={(e) => setInvoiceData({ ...invoiceData, student_id: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.student_id_code}) &bull; Room {s.current_room_number || 'N/A'}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Invoice Title *</label>
              <input
                type="text"
                required
                value={invoiceData.title}
                onChange={(e) => setInvoiceData({ ...invoiceData, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Fee Type</label>
              <select
                value={invoiceData.fee_type}
                onChange={(e) => setInvoiceData({ ...invoiceData, fee_type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="monthly">Monthly Hostel Fee</option>
                <option value="semester">Semester Fee</option>
                <option value="mess">Mess & Dining Fee</option>
                <option value="electricity">Electricity / Utility</option>
                <option value="security_deposit">Security Deposit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Amount ($) *</label>
              <input
                type="number"
                required
                value={invoiceData.amount}
                onChange={(e) => setInvoiceData({ ...invoiceData, amount: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Discount ($)</label>
              <input
                type="number"
                value={invoiceData.discount_amount}
                onChange={(e) => setInvoiceData({ ...invoiceData, discount_amount: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                value={invoiceData.due_date}
                onChange={(e) => setInvoiceData({ ...invoiceData, due_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowInvoiceModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingInvoice}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {creatingInvoice ? 'Generating...' : 'Issue Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Fee Payment (Test-Mode Gateway Architecture)"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
            Secure Test Mode Active: Simulates instant bank/UPI clearance without storing card or CVV.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
              <select
                value={paymentData.payment_method}
                onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="online">Online Card Gateway (Test)</option>
                <option value="upi">UPI Instant Transfer</option>
                <option value="net_banking">Net Banking</option>
                <option value="cash">Cash Bursar Desk</option>
                <option value="cheque">Bank Demand Draft / Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Reference</label>
            <input
              type="text"
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordingPayment}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {recordingPayment ? 'Authorizing...' : 'Authorize & Capture Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FeeManagement;
