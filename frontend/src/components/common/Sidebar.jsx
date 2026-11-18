import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  DoorOpen,
  CreditCard,
  CalendarCheck,
  MessageSquareWarning,
  Wrench,
  UserCheck,
  PlaneTakeoff,
  UtensilsCrossed,
  ShieldCheck,
  BarChart3,
  Settings,
  FileText,
  User,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'student';

  const adminNav = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Rooms & Beds', path: '/admin/rooms', icon: DoorOpen },
    { name: 'Admissions', path: '/admin/admissions', icon: FileText },
    { name: 'Fees & Billing', path: '/admin/fees', icon: CreditCard },
    { name: 'Attendance', path: '/admin/attendance', icon: CalendarCheck },
    { name: 'Complaints', path: '/admin/complaints', icon: MessageSquareWarning },
    { name: 'Maintenance', path: '/admin/maintenance', icon: Wrench },
    { name: 'Visitors', path: '/admin/visitors', icon: UserCheck },
    { name: 'Leave Requests', path: '/admin/leaves', icon: PlaneTakeoff },
    { name: 'Mess & Food', path: '/admin/mess', icon: UtensilsCrossed },
    { name: 'Staff Directory', path: '/admin/staff', icon: ShieldCheck },
    { name: 'Reports & Export', path: '/admin/reports', icon: BarChart3 },
    { name: 'System Settings', path: '/admin/settings', icon: Settings },
  ];

  const wardenNav = [
    { name: 'Warden Dashboard', path: '/warden/dashboard', icon: LayoutDashboard },
    { name: 'Residents', path: '/admin/students', icon: Users },
    { name: 'Room Allocations', path: '/admin/rooms', icon: DoorOpen },
    { name: 'Daily Attendance', path: '/admin/attendance', icon: CalendarCheck },
    { name: 'Leave Approvals', path: '/admin/leaves', icon: PlaneTakeoff },
    { name: 'Visitor Passes', path: '/admin/visitors', icon: UserCheck },
    { name: 'Complaints Queue', path: '/admin/complaints', icon: MessageSquareWarning },
    { name: 'Maintenance', path: '/admin/maintenance', icon: Wrench },
    { name: 'Mess Schedule', path: '/admin/mess', icon: UtensilsCrossed },
  ];

  const accountantNav = [
    { name: 'Finance Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Student Billing', path: '/admin/fees', icon: CreditCard },
    { name: 'Student Invoices', path: '/admin/fees?tab=invoices', icon: FileText },
    { name: 'Payment Receipts', path: '/admin/fees?tab=payments', icon: CreditCard },
    { name: 'Expense Registry', path: '/admin/settings?tab=expenses', icon: BarChart3 },
    { name: 'Financial Reports', path: '/admin/reports', icon: FileText },
  ];

  const studentNav = [
    { name: 'My Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/student/profile', icon: User },
    { name: 'Room & Roommates', path: '/student/room', icon: DoorOpen },
    { name: 'Fees & Invoices', path: '/student/fees', icon: CreditCard },
    { name: 'Attendance Record', path: '/student/attendance', icon: CalendarCheck },
    { name: 'Lodge Complaint', path: '/student/complaints', icon: MessageSquareWarning },
    { name: 'Apply for Leave', path: '/student/leaves', icon: PlaneTakeoff },
    { name: 'Mess Menu & Rating', path: '/student/mess', icon: UtensilsCrossed },
  ];

  let navItems = studentNav;
  if (role === 'super_admin' || role === 'hostel_admin') navItems = adminNav;
  else if (role === 'warden') navItems = wardenNav;
  else if (role === 'accountant') navItems = accountantNav;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20 font-bold text-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-none">
                GRAND HORIZON
              </div>
              <div className="text-[10px] uppercase font-semibold text-primary-600 dark:text-primary-400 tracking-wider mt-1">
                Hostel Management
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Badge */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Logged in as:</div>
          <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
            {user?.role_display || role.replace('_', ' ')}
          </span>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-center">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            Enterprise Edition v2.0
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-600 mt-0.5">
            SQLite Database Connected
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
