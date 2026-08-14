import React from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  Loader2, 
  ShieldCheck, 
  MessageSquare, 
  Users,
  ArrowLeft
} from 'lucide-react';

interface ChatHeaderProps {
  chatId: string;
  chatType?: 'direct' | 'peer' | 'group';
  title?: string;
  inCall: boolean;
  isCalling: boolean;
  isMuted: boolean;
  canEmitAudio: boolean;
  onBackMobile?: () => void;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onUnmuteAudio?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatId,
  chatType = 'direct',
  title,
  inCall,
  isCalling,
  isMuted,
  canEmitAudio,
  onBackMobile,
  onStartCall,
  onEndCall,
  onToggleMute,
  onUnmuteAudio
}) => {
  const displayTitle = title || (
    chatType === 'direct' 
      ? 'Atención de Dudas' 
      : chatType === 'peer' 
      ? 'Chat con Compañero' 
      : 'Canal Grupal'
  );

  return (
    <div className="p-3.5 bg-white dark:bg-slate-800 border-b border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-2 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 md:hidden rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className={`p-2.5 rounded-2xl ${
            chatType === 'direct' 
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
              : chatType === 'peer' 
              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
              : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
          }`}>
            {chatType === 'direct' ? <ShieldCheck className="w-5 h-5" /> : chatType === 'peer' ? <MessageSquare className="w-5 h-5" /> : <Users className="w-5 h-5" />}
          </div>
          
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {displayTitle}
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              {chatId}
            </p>
          </div>
        </div>

        {/* Botón Iniciar Llamada de Voz */}
        {!inCall && (
          <button
            onClick={onStartCall}
            disabled={isCalling}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            {isCalling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
            <span>{isCalling ? 'Conectando...' : '🔊 Llamar'}</span>
          </button>
        )}
      </div>

      {/* Indicadores de Llamada de Voz Activa */}
      {inCall && (
        <div className="mt-1 bg-emerald-950/90 text-emerald-100 p-2.5 px-3.5 rounded-2xl border border-emerald-800/60 flex items-center justify-between text-xs font-medium animate-fade-in shadow-inner">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">Llamada de voz en curso</span>
          </div>

          <div className="flex items-center gap-2">
            {canEmitAudio && (
              <button
                onClick={onToggleMute}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isMuted ? 'bg-rose-600 text-white' : 'bg-emerald-800 text-emerald-100 hover:bg-emerald-700'
                }`}
                title={isMuted ? 'Desmutear micrófono' : 'Mutear micrófono'}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            )}

            {onUnmuteAudio && (
              <button
                onClick={onUnmuteAudio}
                className="p-2 bg-emerald-800 text-emerald-100 hover:bg-emerald-700 rounded-xl cursor-pointer"
                title="Activar Altavoz"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onEndCall}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              Colgar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
