import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import { User, Lock, Save, KeyRound, ShieldCheck } from 'lucide-react';

const StudentProfileView = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile editable fields
  const [editForm, setEditForm] = useState({
    emergency_contact_name: '',
    emergency_contact_phone: '',
    blood_group: 'O+',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password fields
  const [pwdForm, setPwdForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students/');
      const s = res.data.students?.[0];
      setStudent(s);
      if (s) {
        setEditForm({
          emergency_contact_name: s.emergency_contact_name || '',
          emergency_contact_phone: s.emergency_contact_phone || '',
          blood_group: s.blood_group || 'O+',
        });
      }
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/auth/profile', editForm);
      toast.success('Emergency contact details updated successfully');
      fetchProfile();
    } catch (err) {
      toast.error('Failed to update details');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwdForm.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPwd(true);
    try {
      await api.put('/auth/change-password', {
        old_password: pwdForm.old_password,
        new_password: pwdForm.new_password,
      });
      toast.success('Password changed successfully');
      setPwdForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPwd(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm font-semibold text-slate-500">Loading Student Profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          My Profile & Security
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review your institutional record, update emergency phone numbers, and manage login passwords
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-primary-600" />
            Resident Particulars
          </h3>

          <div className="space-y-2.5">
            <div>
              <span className="text-slate-400">Full Legal Name:</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">{student?.full_name}</p>
            </div>
            <div>
              <span className="text-slate-400">Student ID Number:</span>
              <p className="font-mono font-bold text-primary-600 dark:text-primary-400 mt-0.5">{student?.student_id_code}</p>
            </div>
            <div>
              <span className="text-slate-400">Email Address:</span>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{student?.email}</p>
            </div>
            <div>
              <span className="text-slate-400">Academic Program:</span>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{student?.course} ({student?.department})</p>
            </div>
            <div>
              <span className="text-slate-400">Current Room:</span>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">Room {student?.current_room_number || 'Unallocated'} &bull; {student?.current_bed_number}</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px]">
              Editable Emergency Information
            </h4>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Emergency Contact Person</label>
              <input
                type="text"
                value={editForm.emergency_contact_name}
                onChange={(e) => setEditForm({ ...editForm, emergency_contact_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Emergency Phone Number</label>
              <input
                type="tel"
                value={editForm.emergency_contact_phone}
                onChange={(e) => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Blood Group</label>
              <select
                value={editForm.blood_group}
                onChange={(e) => setEditForm({ ...editForm, blood_group: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Saving...' : 'Update Emergency Info'}</span>
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs h-fit">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600" />
            Security & Change Password
          </h3>

          <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={pwdForm.old_password}
                onChange={(e) => setPwdForm({ ...pwdForm, old_password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">New Password (min 6 characters) *</label>
              <input
                type="password"
                required
                value={pwdForm.new_password}
                onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                value={pwdForm.confirm_password}
                onChange={(e) => setPwdForm({ ...pwdForm, confirm_password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={changingPwd}
              className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 mt-4"
            >
              <Lock className="w-4 h-4" />
              <span>{changingPwd ? 'Updating Password...' : 'Change Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileView;
