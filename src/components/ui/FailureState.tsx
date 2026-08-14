import React from 'react';

interface FailureStateProps {
  message?: string;
  onRetry?: () => void;
}

export const FailureState: React.FC<FailureStateProps> = ({ 
  message = "Ha ocurrido un error inesperado.", 
  onRetry 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-red-50 dark:bg-red-900/20 rounded-2xl border-2 border-red-100 dark:border-red-900/50">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Error</h3>
      <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-sm">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="mt-6 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  );
};
