import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'glass' | 'gradient' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = "rounded-2xl transition-all duration-200";

  const variants = {
    default: "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-premium",
    interactive: "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-premium hover:shadow-premium-hover hover:border-slate-200 dark:hover:border-slate-600 cursor-pointer active:scale-[0.99]",
    glass: "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/30 dark:border-slate-700/40 shadow-premium",
    gradient: "bg-gradient-to-br from-indigo-50/80 to-blue-50/40 dark:from-slate-800/60 dark:to-slate-900/40 border border-indigo-100/50 dark:border-slate-700/60 shadow-premium",
    bordered: "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700",
  };

  const paddings = {
    none: "",
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  const variantStyle = variants[variant] || variants.default;
  const paddingStyle = paddings[padding] || paddings.md;

  return (
    <div
      className={`${baseStyles} ${variantStyle} ${paddingStyle} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`flex flex-col space-y-1.5 pb-4 ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 ${className}`.trim()} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-sm text-slate-500 dark:text-slate-400 leading-relaxed ${className}`.trim()} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`pt-0 ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`flex items-center pt-4 border-t border-slate-100 dark:border-slate-700/60 ${className}`.trim()} {...props}>
    {children}
  </div>
);
