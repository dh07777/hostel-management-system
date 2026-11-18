import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck, UserCheck } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { label: 'Super Admin', u: 'admin', p: 'Admin@123', role: 'super_admin', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
    { label: 'Hostel Admin', u: 'hosteladmin', p: 'HostelAdmin@123', role: 'hostel_admin', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    { label: 'Warden', u: 'warden', p: 'Warden@123', role: 'warden', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    { label: 'Accountant', u: 'accountant', p: 'Accountant@123', role: 'accountant', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    { label: 'Student', u: 'student', p: 'Student@123', role: 'student', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  ];

  const handleDemoSelect = (acc) => {
    setUsername(acc.u);
    setPassword(acc.p);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both username/email and password');
      return;
    }

    setLoading(true);
    try {
      const user = await login(username.trim(), password.trim());
      toast.success(`Welcome back, ${user.full_name}!`);
      
      if (user.role === 'student') {
        navigate('/student/dashboard');
      } else if (user.role === 'warden') {
        navigate('/warden/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid login credentials. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Sign In to Portal
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Access your personalized hostel dashboard & operations
        </p>
      </div>

      {/* Demo Quick-Login Pills */}
      <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Quick Demo One-Click Login</span>
          <span className="text-primary-600 font-semibold lowercase">click to fill</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {demoAccounts.map((acc) => (
            <button
              key={acc.label}
              type="button"
              onClick={() => handleDemoSelect(acc)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                username === acc.u
                  ? 'ring-2 ring-primary-500 font-bold border-transparent'
                  : 'hover:opacity-80'
              } ${acc.badge}`}
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Username or Email
          </label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or student"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
        <p className="text-xs text-slate-500">
          Need student hostel accommodation?{' '}
          <Link
            to="/apply-admission"
            className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
          >
            Apply for Admission
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
