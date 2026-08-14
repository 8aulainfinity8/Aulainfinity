import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff } from 'lucide-react';

interface IncomingCallModalProps {
    isOpen: boolean;
    callerName?: string;
    onAccept: () => void;
    onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
    isOpen, callerName, onAccept, onDecline
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-100 dark:border-slate-700 font-sans"
                    >
                        <div className="p-6 text-center">
                            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <Phone className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Llamada entrante</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">
                                {callerName ? `De ${callerName}` : 'Te están llamando para resolver dudas'}
                            </p>
                            
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={onDecline}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <div className="w-14 h-14 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                                        <PhoneOff className="w-6 h-6 text-red-600 dark:text-red-400" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Rechazar</span>
                                </button>
                                <button
                                    onClick={onAccept}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <div className="w-14 h-14 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center animate-pulse">
                                        <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Aceptar</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
