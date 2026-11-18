import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  ChevronDown,
  AlertTriangle,
  Check
} from 'lucide-react';

const TopNav = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [emergencyAlert, setEmergencyAlert] = useState(null);

  useEffect(() => {
    fetchNotifications();
    fetchEmergencyAlert();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (e) {
      // ignore silently if unauthenticated
    }
  };

  const fetchEmergencyAlert = async () => {
    try {
      const res = await api.get('/notifications/announcements');
      const emergency = res.data.find((a) => a.is_emergency);
      if (emergency) setEmergencyAlert(emergency);
    } catch (e) {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {}
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      {/* Emergency announcement banner if active */}
      {emergencyAlert && (
        <div className="bg-rose-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 max-w-4xl mx-auto truncate">
            <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
            <span className="uppercase tracking-wider font-bold">EMERGENCY NOTICE:</span>
            <span className="truncate">{emergencyAlert.title} — {emergencyAlert.content}</span>
          </div>
          <button
            onClick={() => setEmergencyAlert(null)}
            className="text-white/80 hover:text-white text-xs underline shrink-0 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block text-xs font-medium text-slate-500 dark:text-slate-400">
            Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.full_name}</span>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark / Light Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-semibold text-sm text-slate-900 dark:text-white">
                    Notifications ({unreadCount} unread)
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 my-2">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`py-3 px-2 rounded-lg text-left transition ${
                          !n.is_read ? 'bg-primary-50/40 dark:bg-primary-950/30' : ''
                        }`}
                      >
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {n.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {n.message}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-800"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden md:block">
                {user?.full_name?.split(' ')[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.full_name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {user?.email}
                  </div>
                  <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {user?.role_display || user?.role}
                  </span>
                </div>

                <Link
                  to={user?.role === 'student' ? '/student/profile' : '/admin/settings'}
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  Profile & Account
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition text-left mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
