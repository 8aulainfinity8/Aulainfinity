import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'bottom' | 'right';
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  position = 'bottom',
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const isBottom = position === 'bottom';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <div className={`fixed inset-0 pointer-events-none flex ${isBottom ? 'items-end' : 'justify-end'}`}>
            <motion.div
              initial={isBottom ? { y: '100%' } : { x: '100%' }}
              animate={isBottom ? { y: 0 } : { x: 0 }}
              exit={isBottom ? { y: '100%' } : { x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={`pointer-events-auto w-full bg-white dark:bg-slate-800 shadow-2xl border-slate-200 dark:border-slate-700/80 flex flex-col ${
                isBottom 
                  ? 'max-h-[90vh] rounded-t-3xl border-t pb-safe' 
                  : 'h-full max-w-md border-l'
              } ${className}`.trim()}
            >
              {/* Drag handle on bottom sheet */}
              {isBottom && (
                <div className="w-full flex justify-center pt-3 pb-1">
                  <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-700/60">
                <div className="space-y-1 pr-6">
                  {typeof title === 'string' ? (
                    <h3 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
                      {title}
                    </h3>
                  ) : (
                    title
                  )}
                  {description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Cerrar panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto flex-1">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700/60">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
