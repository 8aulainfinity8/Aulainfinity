import React from 'react';

interface FilterButtonProps {
  view: string;
  label: string;
  count: number;
  setFilter: (view: any) => void;
  currentFilter: string;
}

export const FilterButton: React.FC<FilterButtonProps> = ({ 
  view, 
  label, 
  count, 
  setFilter, 
  currentFilter 
}) => {
  const isActive = currentFilter === view;
  
  return (
    <button
      onClick={() => setFilter(view)}
      className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
        isActive 
          ? 'bg-primary text-white shadow-lg shadow-primary/30' 
          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 border dark:border-slate-600 shadow-sm'
      }`}
    >
      <span>{label}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full ${
        isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
      }`}>
        {count}
      </span>
    </button>
  );
};
