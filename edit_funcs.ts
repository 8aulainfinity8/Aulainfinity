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
