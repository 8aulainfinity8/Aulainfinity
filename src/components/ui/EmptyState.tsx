import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | string;
  className?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  action, 
  primaryAction,
  secondaryAction,
  size = 'md', 
  className = '',
  children 
}) => {
  const sizeStyles = {
    sm: "p-6 sm:p-8",
    md: "p-8 sm:p-12",
    lg: "p-12 sm:p-16",
  };

  const currentSize = (sizeStyles[size as keyof typeof sizeStyles]) || sizeStyles.md;

  return (
    <div className={`flex flex-col items-center justify-center text-center bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/80 transition-all ${currentSize} ${className}`.trim()}>
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-400 dark:text-slate-400 mb-4 transition-transform hover:scale-105">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {(primaryAction || secondaryAction || action) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {primaryAction}
          {action}
          {secondaryAction}
        </div>
      )}
      {children && <div className="mt-4 w-full flex justify-center">{children}</div>}
    </div>
  );
};

