import React, { useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, ArrowLeft, Send } from 'lucide-react';

const OnlineApplicationForm = () => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: 'male',
    date_of_birth: '',
    blood_group: 'O+',
    address: '',
    department: 'Computer Science',
    course: 'B.Tech CS',
    academic_year: '2025-2026',
    preferred_room_type: 'double',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    emergency_contact: '',
  });

  const [submittedApp, setSubmittedApp] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/admissions/', formData);
      setSubmittedApp(res.data);
      toast.success('Hostel admission application submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal Login
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-xs text-slate-900 dark:text-white">GRAND HORIZON HOUSING</span>
          </div>
        </div>

        {submittedApp ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Application Submitted Successfully!
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Thank you for applying for residential accommodation at Grand Horizon University Hostel.
            </p>

            <div className="p-4 bg-primary-50 dark:bg-primary-950/60 rounded-2xl max-w-sm mx-auto border border-primary-200 dark:border-primary-800 text-xs">
              <div className="text-slate-500">Your Official Application Reference:</div>
              <div className="text-xl font-black font-mono text-primary-600 dark:text-primary-400 mt-1">
                {submittedApp.application_number}
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              The Hostel Warden and Admissions committee will review your submission. Once approved, your student credentials will be sent to <b>{formData.email}</b>.
            </p>

            <div className="pt-4 flex justify-center gap-3">
              <Link
                to="/login"
                className="py-2.5 px-6 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-500/25 transition"
              >
                Go to Student Portal
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Online Hostel Admission Application
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Fill in candidate and guardian details to reserve residential accommodation
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Personal Info */}
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                  1. Candidate Particulars
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <option value="male">Male (Emerald Tower)</option>
                      <option value="female">Female (Sapphire Hall)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Blood Group</label>
                    <select
                      value={formData.blood_group}
                      onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
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
                </div>
              </div>

              {/* Academic & Room Pref */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                  2. Academic & Room Preference
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Degree / Course</label>
                    <input
                      type="text"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Preferred Room</label>
                    <select
                      value={formData.preferred_room_type}
                      onChange={(e) => setFormData({ ...formData, preferred_room_type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <option value="single">Single AC Room ($450/mo)</option>
                      <option value="double">Double Sharing ($320/mo)</option>
                      <option value="triple">Triple Sharing ($250/mo)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Parent Info */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                  3. Parent / Guardian Contacts
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Parent Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.parent_name}
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Parent Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.parent_phone}
                      onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Home Residential Address</label>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-3 px-8 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/25 flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Submitting Application...' : 'Submit Application'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineApplicationForm;
