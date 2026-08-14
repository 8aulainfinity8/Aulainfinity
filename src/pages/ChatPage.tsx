import React, { useContext, useState } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { ChatList } from '@/components/ChatList';
import { ChatRoom } from '@/components/ChatRoom';
import { MessageSquare } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatType, setActiveChatType] = useState<'direct' | 'peer' | 'group'>('direct');

  if (!user) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        Por favor inicie sesión para acceder al centro de mensajes.
      </div>
    );
  }

  const currentUser = {
    uid: (user as any).uid || user.id || 'anon_user',
    name: user.name || 'Usuario',
    email: user.email || '',
    role: (user.role as 'admin' | 'profesor' | 'alumno') || 'alumno',
    avatar: (user as any).avatar
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] max-w-6xl mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
      
      {/* Panel Izquierdo: Lista de Conversaciones */}
      <div className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col shrink-0 bg-slate-50/50 dark:bg-slate-850 ${
        activeChatId ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Centro de Mensajes
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            AulaInfinity • Asistencia y Grupos
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ChatList
            currentUserId={currentUser.uid}
            activeChatId={activeChatId}
            onSelectChat={(chatId, type) => {
              setActiveChatId(chatId);
              setActiveChatType(type);
            }}
          />
        </div>
      </div>

      {/* Panel Derecho: Chat Activo */}
      <div className={`flex-1 flex flex-col bg-slate-100/50 dark:bg-slate-900 ${
        !activeChatId ? 'hidden md:flex' : 'flex'
      }`}>
        {activeChatId ? (
          <ChatRoom
            key={activeChatId}
            chatId={activeChatId}
            chatType={activeChatType}
            user={currentUser}
            onBackMobile={() => setActiveChatId(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs p-8 text-center">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 rounded-full mb-3 text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              Selecciona una conversación
            </h3>
            <p className="max-w-xs text-slate-400">
              Selecciona un chat del listado para ver los mensajes o realizar una llamada de voz en tiempo real.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ChatPage;
