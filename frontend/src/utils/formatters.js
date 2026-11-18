export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (e) {
    return dateStr;
  }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateStr;
  }
};

export const getStatusBadgeClass = (status) => {
  const s = String(status).toLowerCase();
  switch (s) {
    case 'active':
    case 'paid':
    case 'approved':
    case 'completed':
    case 'resolved':
    case 'checked_in':
    case 'present':
    case 'in_stock':
    case 'available':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800';
    
    case 'pending':
    case 'submitted':
    case 'under_review':
    case 'waitlisted':
    case 'unpaid':
    case 'scheduled':
    case 'low_stock':
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800';

    case 'in_progress':
    case 'assigned':
    case 'partially_paid':
    case 'transferred':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800';

    case 'inactive':
    case 'rejected':
    case 'overdue':
    case 'cancelled':
    case 'suspended':
    case 'absent':
    case 'out_of_stock':
    case 'full':
    case 'checked_out':
      return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800';

    case 'on_leave':
    case 'vacated':
      return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800';

    default:
      return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
};
