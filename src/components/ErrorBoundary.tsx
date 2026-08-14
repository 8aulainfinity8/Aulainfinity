import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon } from './icons';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4 text-slate-900 dark:text-slate-50">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-red-100 dark:border-red-900/40 p-8 text-center animate-fade-in">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <ExclamationTriangleIcon className="w-9 h-9 animate-pulse" />
            </div>
            
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              Se ha producido un error
            </h2>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Ha ocurrido un problema al procesar o cargar esta pantalla de la aplicación. Por favor, intenta recargar la página.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-slate-900/80 rounded-xl border border-red-200/60 dark:border-red-800/40 text-left overflow-auto max-h-32">
                <p className="text-xs font-mono text-red-700 dark:text-red-300 break-words font-semibold">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all duration-200 text-sm"
              >
                Recargar página
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 py-3 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-all duration-200 text-sm"
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
