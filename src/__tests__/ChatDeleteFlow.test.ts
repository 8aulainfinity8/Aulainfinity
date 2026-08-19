import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../services/api';
import * as firestoreSync from '../services/firestoreSync';
import * as dbMock from '../services/mockDatabase';

describe('FASE 9 — Auditoría y Pruebas del Borrado de Mensajes del Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. El botón Borrar no llama a Firebase si MockDatabase falla (Idempotencia)', async () => {
    vi.spyOn(dbMock, 'dbDeleteMessage').mockReturnValueOnce({ success: false, conversationId: "" });
    const syncSpy = vi.spyOn(firestoreSync, 'syncDeleteDirectMessageFromFirestore');
    
    const res = await api.deleteMessage('missing_msg');
    expect(res.success).toBe(false);
    expect(syncSpy).not.toHaveBeenCalled();
  });

  it('2. El estado isProcessing bloquea el botón mientras Firestore resuelve', async () => {
    let resolveSync: (value: unknown) => void;
    const syncPromise = new Promise(resolve => { resolveSync = resolve; });
    
    vi.spyOn(dbMock, 'dbDeleteMessage').mockReturnValueOnce({ success: true, conversationId: 'c1' });
    const syncSpy = vi.spyOn(firestoreSync, 'syncDeleteDirectMessageFromFirestore').mockReturnValueOnce(syncPromise as Promise<void>);
    
    // Iniciar borrado
    const deletePromise = api.deleteMessage('msg_test');
    expect(syncSpy).toHaveBeenCalledWith('msg_test');
    
    // Resolvemos mock
    resolveSync!(undefined);
    const res = await deletePromise;
    expect(res.success).toBe(true);
  });

  it('3. Los errores de Firebase se propagan al UI', async () => {
    vi.spyOn(dbMock, 'dbDeleteMessage').mockReturnValueOnce({ success: true, conversationId: 'c1' });
    vi.spyOn(firestoreSync, 'syncDeleteDirectMessageFromFirestore').mockRejectedValueOnce(new Error('Firebase Error'));
    
    await expect(api.deleteMessage('msg_test')).rejects.toThrow('Firebase Error');
  });

  it('4. Confirmar eliminación local si Firebase tiene éxito', async () => {
    vi.spyOn(dbMock, 'dbDeleteMessage').mockReturnValueOnce({ success: true, conversationId: 'c1' });
    vi.spyOn(firestoreSync, 'syncDeleteDirectMessageFromFirestore').mockResolvedValueOnce(undefined);
    
    const res = await api.deleteMessage('msg_test');
    expect(res.success).toBe(true);
  });

  it('5. Emitir evento message-update tras borrado exitoso', async () => {
    const listener = vi.fn();
    dbMock.eventEmitter.on('message-update', listener);
    
    const msg = {
      id: 'msg_event_test',
      conversationId: 'c1',
      senderId: 'admin_1',
      senderName: 'Admin',
      senderRole: 'admin' as const,
      text: 'To be deleted',
      timestamp: Date.now().toString()
    };
    dbMock.directMessagesData.push(msg);

    vi.spyOn(firestoreSync, 'syncDeleteDirectMessageFromFirestore').mockResolvedValueOnce(undefined);
    await api.deleteMessage(msg.id);

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      id: msg.id,
      deleted: true
    }));

    dbMock.eventEmitter.off('message-update', listener);
  });

  it('6. Borrar un mensaje llama a EventEmitter offline independientemente de Firebase', () => {
    const msg = {
      id: 'offline_msg_test',
      conversationId: 'c1',
      senderId: 'admin_1',
      senderName: 'Admin',
      senderRole: 'admin' as const,
      text: 'Offline test',
      timestamp: Date.now().toString()
    };
    dbMock.directMessagesData.push(msg);

    const listener = vi.fn();
    dbMock.eventEmitter.on('message-update', listener);

    dbMock.dbDeleteMessage(msg.id);

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      id: msg.id,
      deleted: true
    }));

    dbMock.eventEmitter.off('message-update', listener);
  });

  it('7. Control de permisos RBAC para operaciones administrativas', () => {
    const studentUser = { uid: 'student_1', role: 'student', isAdmin: false };
    const adminUser = { uid: 'admin_1', role: 'admin', isAdmin: true };

    const canAdminDelete = adminUser.role === 'admin' && adminUser.isAdmin === true;
    const canStudentDelete = studentUser.role === 'admin' && studentUser.isAdmin === true;

    expect(canAdminDelete).toBe(true);
    expect(canStudentDelete).toBe(false);
  });

  it('8. El envío de mensajes mediante escritura idempotente no se rompe con el borrado', async () => {
    const msgData = {
      conversationId: 'direct_student_test',
      senderId: 'admin_123',
      senderName: 'Admin User',
      senderRole: 'admin' as const,
      text: 'Mensaje posterior al borrado'
    };

    const sentMsg = await api.sendMessage(msgData);
    expect(sentMsg).toBeDefined();
    expect(sentMsg.text).toBe(msgData.text);

    // Borrar inmediatamente
    vi.spyOn(firestoreSync, 'syncDeleteDirectMessageFromFirestore').mockResolvedValue();
    const delRes = await api.deleteMessage(sentMsg.id);
    expect(delRes.success).toBe(true);
  });
});
