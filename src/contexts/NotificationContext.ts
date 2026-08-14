

import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircleIcon, XCircleIcon, CloseIcon, InfoIcon } from '../components/icons';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  icon?: React.ReactNode;
}

interface NotificationContextType {
  addToast: (message: string, type?: 'success' | 'error' | 'info', icon?: React.ReactNode) => void;
}

export const NotificationContext = createContext<NotificationContextType>({
  addToast: () => {},
});

// FIX: Added NotificationProvider to handle toast notifications.
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', icon?: React.ReactNode) => {
        const id = Date.now() + Math.random();
        setToasts(prevToasts => [...prevToasts, { id, message, type, icon }]);
        setTimeout(() => {
            setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
        }, 5000);
    }, []);
    
    const removeToast = (id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    };

    const toastIcons = {
        success: React.createElement(CheckCircleIcon, { className: "w-6 h-6 text-green-500" }),
        error: React.createElement(XCircleIcon, { className: "w-6 h-6 text-red-500" }),
        info: React.createElement(InfoIcon, { className: "w-6 h-6 text-blue-500" }),
    };

    const toastStyles = {
        success: 'bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-700',
        error: 'bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-700',
        info: 'bg-blue-50 dark:bg-blue-900/50 border-blue-200 dark:border-blue-700',
    };

    return React.createElement(
        NotificationContext.Provider,
        { value: { addToast } },
        React.createElement(
            React.Fragment,
            null,
            children,
            React.createElement(
                'div',
                { 
                    className: "fixed top-5 right-4 left-4 md:left-auto md:right-5 z-[100] space-y-3 w-auto md:w-full md:max-w-xs text-sm",
                    role: 'status',
                    'aria-live': 'polite',
                },
                toasts.map(toast =>
                    React.createElement(
                        'div',
                        {
                            key: toast.id,
                            className: `flex items-center p-4 rounded-lg shadow-lg border animate-fade-in ${toastStyles[toast.type]}`,
                        },
                        React.createElement(
                            'div',
                            { className: 'flex-shrink-0' },
                            toast.icon || toastIcons[toast.type]
                        ),
                        React.createElement(
                            'p',
                            { className: 'ml-3 font-medium text-slate-900 dark:text-slate-100 flex-1' },
                            toast.message
                        ),
                        React.createElement(
                            'button',
                            {
                                onClick: () => removeToast(toast.id),
                                className: 'ml-auto flex-shrink-0 p-1 rounded-full hover:bg-black/10',
                            },
                            React.createElement(CloseIcon, {
                                className: 'w-5 h-5 text-gray-500 dark:text-gray-300',
                            })
                        )
                    )
                )
            )
        )
    );
};