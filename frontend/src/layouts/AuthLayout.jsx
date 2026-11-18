import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Building2, ShieldCheck, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const AuthLayout = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top mini header */}
      <div className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20 font-bold text-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              GRAND HORIZON
            </div>
            <div className="text-[10px] uppercase font-bold text-primary-600 dark:text-primary-400 tracking-wider">
              Hostel Management System
            </div>
          </div>
        </Link>

        <button
          onClick={toggleDarkMode}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200/60 dark:border-slate-800/60">
        <p>&copy; {new Date().getFullYear()} Grand Horizon Hostel Management Platform. Secure Enterprise Portal.</p>
      </div>
    </div>
  );
};

export default AuthLayout;
