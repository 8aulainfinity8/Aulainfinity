import React from 'react';
import { TrashIcon, XCircleIcon } from './icons';
import { Button } from './ui/Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    isDestructive?: boolean;
    children?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isLoading = false,
    isDestructive = false,
    children,
}) => {
    if (!isOpen) return null;

    const Icon = isDestructive ? TrashIcon : XCircleIcon;
    const iconColor = isDestructive ? 'text-red-600' : 'text-yellow-600';
    const iconBgColor = isDestructive ? 'bg-red-100' : 'bg-yellow-100';

    return (
        <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-desc"
            role="dialog"
        >
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${iconBgColor}`}>
                        <Icon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                    <h3 id="modal-title" className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-5">{title}</h3>
                    <p id="modal-desc" className="mt-2 text-slate-600 dark:text-slate-400">
                        {description}
                    </p>
                    {children}
                </div>
                <div className="flex justify-end items-center gap-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-b-xl">
                    <Button variant="secondary" onClick={onClose}>
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        isLoading={isLoading}
                        variant={isDestructive ? 'danger' : 'primary'}
                    >
                        {isLoading ? 'Procesando...' : confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};
