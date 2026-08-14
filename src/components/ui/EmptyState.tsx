import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, children }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
      {icon && <div className="text-gray-400 dark:text-slate-600 mb-4">{icon}</div>}
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      {description && <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};
