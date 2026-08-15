import { useState, useEffect, useCallback } from 'react';
import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limitToLast,
  serverTimestamp, 
  increment,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import * as api from '../services/api';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole?: string;
  text: string;
  timestamp: any;
  type?: 'text' | 'voice_note';
  attachments?: any[];
}

export interface ChatMetadata {
  chatId: string;
  type: 'direct' | 'peer' | 'group';
  participants: string[];
  status?: 'open' | 'pending' | 'resolved' | 'closed';
  subjectId?: string;
  lastMessage?: string;
  lastMessageTimestamp?: any;
  unreadCount?: Record<string, number>;
  isMuted?: boolean;
}

/**
 * Infiere los IDs de participantes a partir del identificador determinista del chat
 */
export function inferParticipantsFromChatId(chatId: string, currentUserId: string): string[] {
  const set = new Set<string>();
  if (currentUserId) set.add(currentUserId);

  if (!chatId) return Array.from(set);

  if (chatId.startsWith('direct_')) {
    // Formato: direct_<profesorId>_<alumnoId>_<subjectId>
    const withoutPrefix = chatId.replace('direct_', '');
    const parts = withoutPrefix.split('_');
    if (parts[0]) set.add(parts[0]);
    if (parts[1]) set.add(parts[1]);
  } else if (chatId.startsWith('peer_')) {
    // Formato: peer_<uid1>_<uid2>
    const withoutPrefix = chatId.replace('peer_', '');
    const parts = withoutPrefix.split('_');
    if (parts[0]) set.add(parts[0]);
    if (parts[1]) set.add(parts[1]);
  }

  return Array.from(set);
}

export function useChat(chatId: string | null, currentUserId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatMeta, setChatMeta] = useState<ChatMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Escuchar metadatos del chat y mensajes en tiempo real
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setChatMeta(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Documento de metadatos del chat
    const chatRef = doc(db, 'chats', chatId);
    const unsubChat = onSnapshot(
      chatRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          setChatMeta({ chatId: snapshot.id, ...snapshot.data() } as ChatMetadata);
        } else {
          setChatMeta(null);
        }
      }, 
      (err) => {
        console.error('Error al obtener metadatos del chat:', err);
        setError('No se pudieron cargar los metadatos de la conversación.');
      }
    );

    // Subcolección de mensajes ordenada cronológicamente (limitada a los últimos 100 para escalabilidad y ahorro de lecturas)
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc'),
      limitToLast(100)
    );

    const unsubMessages = onSnapshot(
      messagesQuery, 
      (snapshot) => {
        const msgs: ChatMessage[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as ChatMessage));
        setMessages(msgs);
        setLoading(false);
      }, 
      (err) => {
        console.error('Error al escuchar mensajes:', err);
        setError('Error en la conexión en tiempo real con los mensajes.');
        setLoading(false);
      }
    );

    return () => {
      unsubChat();
      unsubMessages();
    };
  }, [chatId]);

  // Marcar como leído los mensajes de la conversación actual
  const markAsRead = useCallback(async () => {
    if (!chatId || !currentUserId) return;

    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`unreadCount.${currentUserId}`]: 0
      }).catch(() => {});
    } catch (err) {
      console.error('Error al marcar mensajes como leídos:', err);
    }
  }, [chatId, currentUserId]);

  // Enviar mensaje e inicializar correctamente metadatos e unreadCount
  const sendMessage = async (
    text: string, 
    type: 'text' | 'voice_note' = 'text',
    customParticipants?: string[],
    attachments?: any[],
    senderRole?: string
  ) => {
    if (!chatId || !currentUserId || (!text.trim() && (!attachments || attachments.length === 0))) return;

    try {
      const chatRef = doc(db, 'chats', chatId);
      const messagesRef = collection(db, 'chats', chatId, 'messages');

      let chatExists = false;
      let participantsList: string[] = customParticipants || [];

      // Try to get document from server or cache
      try {
        const chatSnap = await getDoc(chatRef);
        chatExists = chatSnap.exists();
        const data = chatExists ? chatSnap.data() : null;
        if (participantsList.length === 0 && data?.participants?.length) {
          participantsList = data.participants;
        }
      } catch (getDocErr) {
        console.warn('[useChat] getDoc failed (possibly offline), falling back to local state:', getDocErr);
        if (chatMeta) {
          chatExists = true;
          if (participantsList.length === 0 && chatMeta.participants?.length) {
            participantsList = chatMeta.participants;
          }
        }
      }

      if (participantsList.length === 0) {
        participantsList = inferParticipantsFromChatId(chatId, currentUserId);
      }

      if (!participantsList.includes(currentUserId)) {
        participantsList.push(currentUserId);
      }

      // Contador inicial de no leídos
      const initialUnread: Record<string, number> = {};
      participantsList.forEach(pId => {
        initialUnread[pId] = pId === currentUserId ? 0 : 1;
      });

      // Si la conversación no existe en Firestore, crearla
      if (!chatExists) {
        await setDoc(chatRef, {
          chatId,
          type: chatId.startsWith('direct_') ? 'direct' : chatId.startsWith('peer_') ? 'peer' : 'group',
          participants: participantsList,
          lastMessage: text,
          lastMessageTimestamp: serverTimestamp(),
          unreadCount: initialUnread,
          createdAt: serverTimestamp()
        }, { merge: true }).catch((err) => {
          console.warn('[useChat] Error creating chat (possibly queued offline):', err);
        });
      }

      // Insertar el nuevo mensaje
      const messagePayload: any = {
        senderId: currentUserId,
        text,
        type,
        timestamp: serverTimestamp(),
        participants: participantsList
      };
      if (senderRole) {
        messagePayload.senderRole = senderRole;
      }
      if (attachments && attachments.length > 0) {
        messagePayload.attachments = attachments;
      }
      await addDoc(messagesRef, messagePayload);

      // Incrementar contador de no leídos para los otros participantes
      const updateData: Record<string, any> = {
        lastMessage: text,
        lastMessageTimestamp: serverTimestamp(),
      };

      participantsList.forEach(pId => {
        if (pId !== currentUserId) {
          updateData[`unreadCount.${pId}`] = increment(1);
        }
      });

      if (chatExists) {
        await updateDoc(chatRef, updateData).catch(async (err) => {
          console.warn('[useChat] updateDoc failed, retrying with setDoc merge:', err);
          await setDoc(chatRef, {
            lastMessage: text,
            lastMessageTimestamp: serverTimestamp(),
            unreadCount: initialUnread
          }, { merge: true }).catch((setErr) => {
            console.warn('[useChat] Fallback setDoc also failed/queued:', setErr);
          });
        });
      }

      try {
        await api.sendMessage({
          conversationId: chatId,
          senderId: currentUserId,
          senderRole: (senderRole || 'student') as any,
          text,
          attachments
        });
      } catch (apiErr) {
        console.warn('Could not sync message to mock API backend:', apiErr);
      }

    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      setError('No se pudo enviar el mensaje. Verifica tu conexión.');
      throw err;
    }
  };

  return {
    messages,
    chatMeta,
    loading,
    error,
    sendMessage,
    markAsRead
  };
}
