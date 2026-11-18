import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-primary-500/20 mb-4">
        <Building2 className="w-8 h-8" />
      </div>
      <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">404</h1>
      <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-2">Page Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm mt-1">
        The requested hostel navigation route does not exist or has been relocated.
      </p>

      <Link
        to="/"
        className="mt-6 py-2.5 px-6 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-500/25 transition inline-flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};

export default NotFound;
