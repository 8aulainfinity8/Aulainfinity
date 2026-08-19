import fs from 'fs';
let code = fs.readFileSync('src/hooks/useChat.ts', 'utf8');

const regex = /return {\s*editMessage,\s*deleteMessage,\s*const editMessage[\s\S]*?throw err;\n    }\n  };\n\s*messages,/m;

const replacement = `
  const editMessage = async (messageId: string, newText: string) => {
    if (!chatId || !currentUserId || !messageId) return;
    try {
      const currentUser = auth?.currentUser;
      const isFirebaseAuthed = Boolean(currentUser && currentUser.emailVerified);
      if (!isFirebaseAuthed) {
        if (chatId.startsWith('peer_')) {
            await api.editPeerMessage(messageId, newText);
        } else if (chatId.startsWith('teacher_')) {
            await api.editTeacherMessage(messageId, newText);
        } else {
            await api.editMessage(messageId, newText);
        }
        return;
      }
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      await updateDoc(messageRef, { text: newText });
    } catch (err) {
      console.error('Error al editar mensaje:', err);
      throw err;
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!chatId || !currentUserId || !messageId) return;
    try {
      const currentUser = auth?.currentUser;
      const isFirebaseAuthed = Boolean(currentUser && currentUser.emailVerified);
      if (!isFirebaseAuthed) {
        if (chatId.startsWith('peer_')) {
            await api.deletePeerMessage(messageId);
        } else if (chatId.startsWith('teacher_')) {
            await api.deleteTeacherMessage(messageId);
        } else {
            await api.deleteMessage(messageId);
        }
        return;
      }
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      await deleteDoc(messageRef);
    } catch (err) {
      console.error('Error al borrar mensaje:', err);
      throw err;
    }
  };

  return {
    editMessage,
    deleteMessage,
    messages,`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/hooks/useChat.ts', code);
