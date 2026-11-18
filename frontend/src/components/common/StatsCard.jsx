import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ title, value, icon: Icon, change, isPositive, subtitle, color = 'blue' }) => {
  const colorMap = {
    blue: 'from-blue-500 to-indigo-600 text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400',
    emerald: 'from-emerald-500 to-teal-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400',
    amber: 'from-amber-500 to-orange-600 text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400',
    purple: 'from-purple-500 to-indigo-600 text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400',
    rose: 'from-rose-500 to-pink-600 text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            {value}
          </div>
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center p-2.5 ${colorMap[color] || colorMap.blue}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {(subtitle || change) && (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <span>{subtitle}</span>
          {change && (
            <span className={`inline-flex items-center font-bold gap-1 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {change}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatsCard;
