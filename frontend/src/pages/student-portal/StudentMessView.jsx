import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { UtensilsCrossed, Star, Send } from 'lucide-react';

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const meals = ['breakfast', 'lunch', 'snacks', 'dinner'];

const StudentMessView = () => {
  const toast = useToast();
  const [menuCalendar, setMenuCalendar] = useState({});
  const [loading, setLoading] = useState(true);

  // Food Feedback Form
  const [fbData, setFbData] = useState({
    meal_type: 'lunch',
    rating: 5,
    hygiene_rating: 5,
    quality_rating: 5,
    comments: '',
  });
  const [submittingFb, setSubmittingFb] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await api.get('/mess/menu');
      setMenuCalendar(res.data.calendar || {});
    } catch (err) {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFb(true);
    try {
      await api.post('/mess/feedback', fbData);
      toast.success('Food quality feedback logged! Thank you.');
      setFbData({ meal_type: 'lunch', rating: 5, hygiene_rating: 5, quality_rating: 5, comments: '' });
    } catch (err) {
      toast.error('Failed to submit feedback');
    } finally {
      setSubmittingFb(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Mess Menu & Dining Hall
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Weekly catered dining schedule, nutritional plans & resident food feedback
        </p>
      </div>

      {/* Weekly Menu Matrix */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Weekly Catering Schedule
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {days.map((day) => (
            <div key={day} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="text-center font-bold text-xs uppercase tracking-wider text-primary-600 dark:text-primary-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                {day}
              </div>

              <div className="space-y-2 text-[11px]">
                {meals.map((m) => {
                  const item = menuCalendar[day]?.[m];
                  return (
                    <div key={m} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between font-bold capitalize text-slate-800 dark:text-slate-200 text-[10px]">
                        <span>{m}</span>
                        <span className="text-[9px] text-slate-400">{item?.timing || ''}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-1 leading-snug line-clamp-3">
                        {item?.items || <span className="text-slate-400 italic">Chef's daily special</span>}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Feedback Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            Rate Today's Food Quality & Hygiene
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Your ratings directly review head chef catering standards</p>
        </div>

        <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Meal Evaluated</label>
              <select
                value={fbData.meal_type}
                onChange={(e) => setFbData({ ...fbData, meal_type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="snacks">Evening Snacks</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Overall Rating (1 - 5 Stars)</label>
              <select
                value={fbData.rating}
                onChange={(e) => setFbData({ ...fbData, rating: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                <option value={5}>5 Stars - Excellent</option>
                <option value={4}>4 Stars - Very Good</option>
                <option value={3}>3 Stars - Average</option>
                <option value={2}>2 Stars - Below Expectations</option>
                <option value={1}>1 Star - Unsatisfactory</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Hygiene Rating (1 - 5)</label>
              <select
                value={fbData.hygiene_rating}
                onChange={(e) => setFbData({ ...fbData, hygiene_rating: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value={5}>5 - Spotless</option>
                <option value={4}>4 - Good</option>
                <option value={3}>3 - Acceptable</option>
                <option value={2}>2 - Poor</option>
                <option value={1}>1 - Inadequate</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Taste & Quality (1 - 5)</label>
              <select
                value={fbData.quality_rating}
                onChange={(e) => setFbData({ ...fbData, quality_rating: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value={5}>5 - Delicious</option>
                <option value={4}>4 - Tasty</option>
                <option value={3}>3 - Standard</option>
                <option value={2}>2 - Needs Flavor Improvement</option>
                <option value={1}>1 - Bland or Overcooked</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Comments / Suggestions</label>
            <textarea
              rows={2}
              required
              value={fbData.comments}
              onChange={(e) => setFbData({ ...fbData, comments: e.target.value })}
              placeholder="e.g. Sambar was warm and fresh, chapati texture was soft..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={submittingFb}
            className="py-2.5 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submittingFb ? 'Submitting...' : 'Submit Review'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentMessView;
