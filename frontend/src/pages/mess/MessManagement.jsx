import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDate, getStatusBadgeClass } from '../../utils/formatters';
import Modal from '../../components/common/Modal';
import { UtensilsCrossed, Plus, Star, Edit, Package, AlertTriangle } from 'lucide-react';

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const meals = ['breakfast', 'lunch', 'snacks', 'dinner'];

const MessManagement = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('menu');
  const [menuCalendar, setMenuCalendar] = useState({});
  const [feedbacks, setFeedbacks] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Menu Modal
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editMenuData, setEditMenuData] = useState({
    day_of_week: 'monday',
    meal_type: 'breakfast',
    items: '',
    timing: '',
    special_diet: '',
  });

  // Inventory Modal
  const [showInvModal, setShowInvModal] = useState(false);
  const [invFormData, setInvFormData] = useState({
    id: null,
    item_name: '',
    category: 'grains',
    quantity: 0,
    unit: 'kg',
    min_stock_threshold: 10,
    unit_price: 0,
    supplier_name: '',
  });

  useEffect(() => {
    fetchMessData();
  }, []);

  const fetchMessData = async () => {
    setLoading(true);
    try {
      const [menuRes, fbRes, invRes] = await Promise.all([
        api.get('/mess/menu'),
        api.get('/mess/feedback'),
        api.get('/mess/inventory'),
      ]);
      setMenuCalendar(menuRes.data.calendar || {});
      setFeedbacks(fbRes.data || []);
      setInventory(invRes.data || []);
    } catch (err) {
      toast.error('Failed to load mess management data');
    } finally {
      setLoading(false);
    }
  };

  const openEditMenu = (day, meal) => {
    const existing = menuCalendar[day]?.[meal] || {};
    setEditMenuData({
      day_of_week: day,
      meal_type: meal,
      items: existing.items || '',
      timing: existing.timing || '',
      special_diet: existing.special_diet || '',
    });
    setShowMenuModal(true);
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/mess/menu', editMenuData);
      toast.success(`Updated ${editMenuData.day_of_week} ${editMenuData.meal_type} menu`);
      setShowMenuModal(false);
      fetchMessData();
    } catch (err) {
      toast.error('Failed to update menu item');
    }
  };

  const handleInvSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/mess/inventory', invFormData);
      toast.success('Inventory stock item saved');
      setShowInvModal(false);
      fetchMessData();
    } catch (err) {
      toast.error('Failed to save inventory item');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Mess & Dining Operations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Weekly meal calendars, dietary oversight, kitchen inventory & student food quality ratings
          </p>
        </div>

        {activeTab === 'inventory' && (
          <button
            onClick={() => {
              setInvFormData({
                id: null,
                item_name: '',
                category: 'grains',
                quantity: 50,
                unit: 'kg',
                min_stock_threshold: 15,
                unit_price: 2.5,
                supplier_name: 'Metro Wholesale Grocers',
              });
              setShowInvModal(true);
            }}
            className="py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-500/25 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Item</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('menu')}
          className={`py-1.5 px-4 rounded-xl text-xs font-bold transition ${
            activeTab === 'menu'
              ? 'bg-primary-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Weekly Dining Menu
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`py-1.5 px-4 rounded-xl text-xs font-bold transition ${
            activeTab === 'feedback'
              ? 'bg-primary-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Student Food Ratings ({feedbacks.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-1.5 px-4 rounded-xl text-xs font-bold transition ${
            activeTab === 'inventory'
              ? 'bg-primary-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Kitchen Stock & Inventory ({inventory.length})
        </button>
      </div>

      {/* Tab 1: Weekly Menu Calendar */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {days.map((day) => (
              <div key={day} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
                <div className="text-center font-bold text-xs uppercase tracking-wider text-primary-600 dark:text-primary-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  {day}
                </div>

                <div className="space-y-2.5 flex-1 text-[11px]">
                  {meals.map((meal) => {
                    const item = menuCalendar[day]?.[meal];
                    return (
                      <div
                        key={meal}
                        onClick={() => openEditMenu(day, meal)}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-primary-50 dark:hover:bg-primary-950/40 border border-slate-100 dark:border-slate-800 cursor-pointer transition group"
                      >
                        <div className="flex items-center justify-between font-bold capitalize text-slate-800 dark:text-slate-200 text-[10px]">
                          <span>{meal}</span>
                          <Edit className="w-3 h-3 text-slate-400 group-hover:text-primary-600 transition" />
                        </div>
                        <p className="text-slate-500 line-clamp-2 mt-1">
                          {item?.items || <span className="italic text-slate-400">Tap to set food item</span>}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Feedback */}
      {activeTab === 'feedback' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {feedbacks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No food feedback logged yet.</div>
            ) : (
              feedbacks.map((fb) => (
                <div key={fb.id} className="py-4 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {fb.student_name} &bull; <span className="capitalize">{fb.meal_type}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>{fb.rating} / 5</span>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">&ldquo;{fb.comments}&rdquo;</p>
                  <div className="text-[10px] text-slate-400">
                    Logged: {formatDate(fb.date)} &bull; Hygiene: {fb.hygiene_rating}/5 &bull; Taste Quality: {fb.quality_rating}/5
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Inventory */}
      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Commodity / Item</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Quantity on Hand</th>
                  <th className="py-3.5 px-4">Safety Threshold</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4">Unit Rate</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {inventory.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white">
                      {inv.item_name}
                    </td>
                    <td className="py-3.5 px-4 capitalize text-slate-600 dark:text-slate-300">
                      {inv.category}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {inv.quantity} {inv.unit}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {inv.min_stock_threshold} {inv.unit}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {inv.supplier_name || 'Direct Wholesale'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      ${inv.unit_price} / {inv.unit}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(inv.status)}`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => {
                          setInvFormData({ ...inv });
                          setShowInvModal(true);
                        }}
                        className="py-1 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-primary-50 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs transition"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Menu Item Modal */}
      <Modal
        isOpen={showMenuModal}
        onClose={() => setShowMenuModal(false)}
        title={`Set Menu: ${editMenuData.day_of_week.toUpperCase()} - ${editMenuData.meal_type.toUpperCase()}`}
      >
        <form onSubmit={handleMenuSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Serving Timing</label>
            <input
              type="text"
              value={editMenuData.timing}
              onChange={(e) => setEditMenuData({ ...editMenuData, timing: e.target.value })}
              placeholder="e.g. 07:30 AM - 09:30 AM"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Food Items & Dishes *</label>
            <textarea
              rows={3}
              required
              value={editMenuData.items}
              onChange={(e) => setEditMenuData({ ...editMenuData, items: e.target.value })}
              placeholder="e.g. Steamed Rice, Dal Makhani, Paneer Butter Masala, Roti, Curd..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Allergen & Diet Details</label>
            <input
              type="text"
              value={editMenuData.special_diet}
              onChange={(e) => setEditMenuData({ ...editMenuData, special_diet: e.target.value })}
              placeholder="e.g. Gluten-free and dairy-free options available on request"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowMenuModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold"
            >
              Save Menu
            </button>
          </div>
        </form>
      </Modal>

      {/* Inventory Item Modal */}
      <Modal
        isOpen={showInvModal}
        onClose={() => setShowInvModal(false)}
        title={invFormData.id ? `Adjust Stock: ${invFormData.item_name}` : 'Add New Inventory Item'}
      >
        <form onSubmit={handleInvSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Commodity / Item Name *</label>
            <input
              type="text"
              required
              value={invFormData.item_name}
              onChange={(e) => setInvFormData({ ...invFormData, item_name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
              <input
                type="number"
                step="0.1"
                required
                value={invFormData.quantity}
                onChange={(e) => setInvFormData({ ...invFormData, quantity: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit</label>
              <select
                value={invFormData.unit}
                onChange={(e) => setInvFormData({ ...invFormData, unit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="kg">kg</option>
                <option value="liters">liters</option>
                <option value="packets">packets</option>
                <option value="units">units</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Min Threshold</label>
              <input
                type="number"
                value={invFormData.min_stock_threshold}
                onChange={(e) => setInvFormData({ ...invFormData, min_stock_threshold: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={invFormData.unit_price}
                onChange={(e) => setInvFormData({ ...invFormData, unit_price: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Supplier / Vendor</label>
              <input
                type="text"
                value={invFormData.supplier_name}
                onChange={(e) => setInvFormData({ ...invFormData, supplier_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowInvModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold"
            >
              Save Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MessManagement;
