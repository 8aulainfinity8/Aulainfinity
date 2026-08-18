import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline' | 'cards';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeTab,
  onChange,
  variant = 'pills',
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const sizes = {
    sm: "text-xs py-1.5 px-3 gap-1.5",
    md: "text-sm py-2 px-4 gap-2",
    lg: "text-base py-2.5 px-5 gap-2.5",
  };

  if (variant === 'underline') {
    return (
      <div className={`flex border-b border-slate-200 dark:border-slate-700/80 overflow-x-auto no-scrollbar ${className}`.trim()} role="tablist">
        {items.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={`flex items-center font-medium border-b-2 transition-all whitespace-nowrap ${sizes[size]} ${
                fullWidth ? 'flex-1 justify-center' : ''
              } ${
                isActive
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
              } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-sans ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Variant: pills (default)
  return (
    <div 
      className={`inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto max-w-full no-scrollbar border border-slate-200/60 dark:border-slate-700/60 ${
        fullWidth ? 'w-full' : ''
      } ${className}`.trim()} 
      role="tablist"
    >
      {items.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`flex items-center font-medium rounded-lg transition-all duration-200 whitespace-nowrap select-none ${sizes[size]} ${
              fullWidth ? 'flex-1 justify-center' : ''
            } ${
              isActive
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-sans ${
                isActive
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
