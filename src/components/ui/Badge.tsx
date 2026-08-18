import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  dotColor?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  dotColor,
  icon,
  className = '',
  ...props
}) => {
  const baseStyles = "inline-flex items-center font-medium transition-colors select-none";

  const variants = {
    default: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700",
    primary: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40",
    secondary: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
    success: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40",
    danger: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200/60 dark:border-red-800/40",
    warning: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40",
    info: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/40",
    purple: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40",
    outline: "bg-transparent border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[11px] rounded-md gap-1",
    md: "px-2.5 py-0.5 text-xs rounded-full gap-1.5",
    lg: "px-3 py-1 text-sm rounded-full gap-2",
  };

  const dotColors = {
    default: "bg-slate-400",
    primary: "bg-blue-500",
    secondary: "bg-slate-400",
    success: "bg-emerald-500",
    danger: "bg-red-500",
    warning: "bg-amber-500",
    info: "bg-cyan-500",
    purple: "bg-purple-500",
    outline: "bg-slate-400",
  };

  const activeDotColor = dotColor || dotColors[variant] || dotColors.default;

  return (
    <span
      className={`${baseStyles} ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`.trim()}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeDotColor}`} />
      )}
      {icon && (
        <span className="shrink-0 flex items-center">{icon}</span>
      )}
      {children}
    </span>
  );
};
