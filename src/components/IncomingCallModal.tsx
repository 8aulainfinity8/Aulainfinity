import React from 'react';
import { Phone, PhoneOff, Volume2 } from 'lucide-react';

interface IncomingCallModalProps {
  isOpen: boolean;
  callerName: string;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  isOpen,
  callerName,
  onAccept,
  onReject
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-200/80 dark:border-slate-700 w-full max-w-sm text-center transform transition-all animate-scale-in">
        
        {/* Ringing Visualizer Indicator */}
        <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30"></span>
          <span className="animate-pulse absolute inline-flex h-16 w-16 rounded-full bg-emerald-500/20"></span>
          <div className="relative w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center text-white shadow-lg">
            <Volume2 className="w-8 h-8 animate-bounce" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
          Llamada Entrante
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          <span className="font-semibold text-slate-800 dark:text-slate-200">{callerName}</span> te está llamando...
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onReject}
            className="flex-1 py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            Rechazar
          </button>

          <button
            onClick={onAccept}
            className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer animate-pulse"
          >
            <Phone className="w-4 h-4" />
            Aceptar
          </button>
        </div>

      </div>
    </div>
  );
};
