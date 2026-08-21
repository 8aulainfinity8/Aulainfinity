import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { MessageSquare, UserCheck, Users, ShieldAlert, Sparkles } from 'lucide-react';

export interface ChatItem {
  id: string;
  type: 'direct' | 'peer' | 'group';
  participants: string[];
  lastMessage?: string;
  lastMessageTimestamp?: any;
  unreadCount?: Record<string, number>;
  status?: 'open' | 'pending' | 'resolved' | 'closed';
  subjectId?: string;
  title?: string;
}

interface ChatListProps {
  currentUserId: string;
  activeChatId: string | null;
  onSelectChat: (chatId: string, type: 'direct' | 'peer' | 'group') => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  currentUserId,
  activeChatId,
  onSelectChat
}) => {
  const [rawChats, setRawChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUserId) return;

    // Consultar chats donde participe el usuario
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUserId)
    );

    const unsub = onSnapshot(
      q, 
      (snapshot) => {
        const list: ChatItem[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as ChatItem));

        setRawChats(list);
        setLoading(false);
      }, 
      (error) => {
        console.error('Error al cargar la lista de conversaciones:', error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUserId]);

  // Ordenar usando useMemo para optimizar rendimiento de re-renders
  const chats = useMemo(() => {
    return [...rawChats].sort((a, b) => {
      const timeA = a.lastMessageTimestamp?.seconds || 0;
      const timeB = b.lastMessageTimestamp?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawChats]);

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-500" />
        <p className="font-medium">Sin conversaciones activas</p>
        <p className="text-[10px] text-slate-400 mt-1">
          Las dudas y salas grupales aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 overflow-y-auto max-h-full">
      {chats.map((chat) => {
        const isActive = chat.id === activeChatId;
        const unread = chat.unreadCount?.[currentUserId] || 0;

        // Formato de hora del último mensaje
        let timeStr = '';
        if (chat.lastMessageTimestamp?.seconds) {
          const date = new Date(chat.lastMessageTimestamp.seconds * 1000);
          timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Título de la conversación
        let title = chat.title || chat.id;
        if (chat.type === 'direct') {
          title = chat.subjectId ? `Duda: ${chat.subjectId}` : 'Atención de Dudas';
        } else if (chat.type === 'peer') {
          title = 'Chat con Compañero';
        } else if (chat.type === 'group') {
          title = chat.id.replace('group_', '').replace('_', ' ');
        }

        return (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id, chat.type)}
            className={`w-full text-left p-3.5 transition-all flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
              isActive 
                ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-l-4 border-indigo-600' 
                : ''
            }`}
          >
            <div className={`p-2.5 rounded-2xl shrink-0 ${
              chat.type === 'direct' 
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
                : chat.type === 'peer' 
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
                : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
            }`}>
              {chat.type === 'direct' ? (
                <ShieldAlert className="w-4 h-4" />
              ) : chat.type === 'peer' ? (
                <UserCheck className="w-4 h-4" />
              ) : (
                <Users className="w-4 h-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {title}
                </span>
                {timeStr && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0">
                    {timeStr}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {chat.lastMessage || 'Sin mensajes'}
                </p>
                {unread > 0 && (
                  <span className="shrink-0 bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                    {unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
