import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  action?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  description,
  children,
  icon,
  onClose,
  action,
  className = '',
  ...props
}) => {
  const variants = {
    info: {
      container: "bg-blue-50/80 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-800/40 text-blue-900 dark:text-blue-200",
      icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />,
    },
    success: {
      container: "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    },
    warning: {
      container: "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
    },
    danger: {
      container: "bg-red-50/80 dark:bg-red-950/30 border-red-200/80 dark:border-red-800/40 text-red-900 dark:text-red-200",
      icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />,
    },
  };

  const currentVariant = variants[variant] || variants.info;

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all text-sm ${currentVariant.container} ${className}`.trim()}
      {...props}
    >
      <div className="mt-0.5">
        {icon || currentVariant.icon}
      </div>
      <div className="flex-1 space-y-1">
        {title && (
          <h5 className="font-semibold leading-tight">
            {title}
          </h5>
        )}
        {description && (
          <div className="text-xs sm:text-sm opacity-90 leading-relaxed">
            {description}
          </div>
        )}
        {children}
        {action && (
          <div className="pt-2">
            {action}
          </div>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Cerrar alerta"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
