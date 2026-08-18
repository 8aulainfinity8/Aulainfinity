import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  register?: any;
  buttonIcon?: React.ReactNode;
  onButtonClick?: () => void;
  buttonAriaLabel?: string;
}

export const FormInput: React.FC<InputProps> = ({ 
  id, 
  label, 
  error, 
  helperText, 
  icon, 
  className = '', 
  register, 
  buttonIcon, 
  onButtonClick, 
  buttonAriaLabel, 
  ...props 
}) => (
  <div className="w-full">
    {label && (
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
    )}
    <div className="relative flex items-center">
      {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 z-10 flex items-center pointer-events-none">{icon}</div>}
      <input 
        id={id}
        aria-invalid={error ? "true" : "false"}
        aria-label={label ? undefined : (props['aria-label'] || props.placeholder)}
        className={`w-full ${icon ? 'pl-10' : 'pl-3.5'} ${buttonIcon ? 'pr-12' : 'pr-3.5'} py-2.5 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm shadow-sm ${error ? 'border-red-500 dark:border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'} ${className}`}
        {...register}
        {...props}
      />
      {buttonIcon && onButtonClick && (
        <button
          type="button"
          onClick={onButtonClick}
          aria-label={buttonAriaLabel}
          className="absolute right-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400 cursor-pointer"
        >
          {buttonIcon}
        </button>
      )}
    </div>
    {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">{error}</p>}
    {!error && helperText && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
  </div>
);

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  register?: any;
}

export const FormSelect: React.FC<SelectProps> = ({ 
  id, 
  label, 
  error, 
  helperText, 
  icon, 
  children, 
  className = '', 
  register, 
  ...props 
}) => (
  <div className="w-full">
    {label && (
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
    )}
    <div className="relative">
      {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 flex items-center pointer-events-none">{icon}</div>}
      <select 
        id={id}
        aria-invalid={error ? "true" : "false"}
        aria-label={label ? undefined : (props['aria-label'] || "Seleccionar opción")}
        className={`w-full ${icon ? 'pl-10' : 'pl-3.5'} pr-10 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm shadow-sm cursor-pointer ${error ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'} ${className}`}
        {...register}
        {...props}
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400 dark:text-slate-500">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
      </div>
    </div>
    {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
    {!error && helperText && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
  </div>
);

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  register?: any;
}

export const FormTextarea: React.FC<TextareaProps> = ({ 
  id, 
  label, 
  error, 
  helperText, 
  className = '', 
  register, 
  ...props 
}) => (
  <div className="w-full">
    {label && (
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
    )}
    <textarea 
      id={id}
      aria-invalid={error ? "true" : "false"}
      aria-label={label ? undefined : (props['aria-label'] || props.placeholder)}
      className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm shadow-sm ${error ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'} ${className}`}
      {...register}
      {...props}
    />
    {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
    {!error && helperText && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
  </div>
);

