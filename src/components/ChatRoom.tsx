import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { useVoiceCall } from '@/hooks/useVoiceCall';
import { ChatHeader } from '@/components/ChatHeader';
import { IncomingCallModal } from '@/components/IncomingCallModal';
import { 
  Send, 
  Loader2, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface ChatRoomProps {
  chatId: string;
  chatType?: 'direct' | 'peer' | 'group';
  title?: string;
  user: {
    uid: string;
    name: string;
    email: string;
    role: 'admin' | 'profesor' | 'alumno';
    avatar?: string;
  };
  onBackMobile?: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  chatId,
  chatType = 'direct',
  title,
  user,
  onBackMobile
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hook de chat de texto
  const { messages, loading, error: chatError, sendMessage, markAsRead } = useChat(chatId, user.uid);

  // Hook de llamada de voz WebRTC
  const {
    inCall,
    isCalling,
    incomingCall,
    callerName,
    isMuted,
    canEmitAudio,
    callError,
    remoteAudioRef,
    startCall,
    acceptCall,
    endCall,
    toggleMute
  } = useVoiceCall({
    chatId,
    chatType,
    userId: user.uid,
    userName: user.name,
    userRole: user.role
  });

  // Auto-scroll al último mensaje y marcar como leído
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    markAsRead();
  }, [messages, markAsRead]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const textToSend = inputText;
    setInputText('');
    await sendMessage(textToSend);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden relative">
      
      {/* Elemento Audio Oculto para reproducción de WebRTC */}
      <audio ref={remoteAudioRef} autoPlay className="hidden" />

      {/* Cabecera del Chat */}
      <ChatHeader
        chatId={chatId}
        chatType={chatType}
        title={title}
        inCall={inCall}
        isCalling={isCalling}
        isMuted={isMuted}
        canEmitAudio={canEmitAudio}
        onBackMobile={onBackMobile}
        onStartCall={startCall}
        onEndCall={endCall}
        onToggleMute={toggleMute}
        onUnmuteAudio={() => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.play().catch(() => {});
          }
        }}
      />

      {/* Alertas de Error si ocurren */}
      {(callError || chatError) && (
        <div className="m-3 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{callError || chatError}</span>
        </div>
      )}

      {/* Modal de Llamada Entrante */}
      <IncomingCallModal
        isOpen={incomingCall}
        callerName={callerName}
        onAccept={acceptCall}
        onReject={endCall}
      />

      {/* Área Principal de Mensajes */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Cargando mensajes...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
            <MessageSquare className="w-8 h-8 mb-2 opacity-40 text-indigo-500" />
            No hay mensajes en esta conversación. ¡Sé el primero en escribir!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user.uid;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] md:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                  {msg.timestamp?.seconds
                    ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Enviando...'}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Envío */}
      <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-transparent"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
