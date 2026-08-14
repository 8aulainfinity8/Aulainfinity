import React, { createContext, useContext, useState, useRef } from 'react';
import { 
    AlertTriangle, 
    Trash2, 
    X, 
    Check, 
    Info, 
    HelpCircle 
} from 'lucide-react';

interface ConfirmOptions {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    variant?: 'danger' | 'warning' | 'info' | 'success';
}

interface ConfirmationContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const ConfirmationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({
        title: '',
        description: ''
    });

    // Reference to resolve the promise
    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = (newOptions: ConfirmOptions): Promise<boolean> => {
        setOptions(newOptions);
        setIsOpen(true);
        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
        });
    };

    const handleCancel = () => {
        setIsOpen(false);
        if (resolveRef.current) {
            resolveRef.current(false);
            resolveRef.current = null;
        }
    };

    const handleConfirm = () => {
        setIsOpen(false);
        if (resolveRef.current) {
            resolveRef.current(true);
            resolveRef.current = null;
        }
    };

    // Get color theme classes based on confirmation type
    const getThemeConfig = () => {
        const isDanger = options.isDestructive || options.variant === 'danger';
        if (isDanger) {
            return {
                icon: <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />,
                iconBg: 'bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/10',
                confirmBtn: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500/40'
            };
        }

        switch (options.variant) {
            case 'warning':
                return {
                    icon: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
                    iconBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/10',
                    confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500/40'
                };
            case 'success':
                return {
                    icon: <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
                    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/10',
                    confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500/40'
                };
            case 'info':
            default:
                return {
                    icon: <Info className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
                    iconBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/10',
                    confirmBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500/40'
                };
        }
    };

    const theme = getThemeConfig();

    return (
        <ConfirmationContext.Provider value={{ confirm }}>
            {children}

            {/* Confirmation Dialog Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
                    onClick={handleCancel}
                >
                    <div 
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-sm overflow-hidden animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Close button */}
                        <div className="flex justify-end p-3 pb-0">
                            <button 
                                onClick={handleCancel}
                                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Dialog contents */}
                        <div className="px-6 pb-6 text-center">
                            <div className={`mx-auto w-12 h-12 rounded-full border flex items-center justify-center ${theme.iconBg} mb-4`}>
                                {theme.icon}
                            </div>
                            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-50 leading-tight">
                                {options.title}
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                {options.description}
                            </p>
                        </div>

                        {/* Interactive Buttons footer */}
                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/40 border-t dark:border-slate-750">
                            <button
                                onClick={handleCancel}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold font-sans text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200/40 dark:border-slate-700/30 cursor-pointer text-center"
                            >
                                {options.cancelText || 'Cancelar'}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-sans shadow-sm transition hover:shadow-md cursor-pointer text-center focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${theme.confirmBtn}`}
                            >
                                {options.confirmText || 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmationContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmationContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmationProvider');
    }
    return context.confirm;
};
