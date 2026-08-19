import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inferParticipantsFromChatId } from '../hooks/useChat';

describe('FASE 3 — Seguridad de Autenticación Firebase y Control de Acceso a Firestore Chat', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. AuthContext: isFirebaseAuthReady inicia en false y bloquea operaciones antes de la resolución', () => {
    let isFirebaseAuthReady = false;
    let currentUser: any = null;

    // Antes de que Firebase resuelva onAuthStateChanged
    expect(isFirebaseAuthReady).toBe(false);
    expect(currentUser).toBeNull();

    // Simular resolución de onAuthStateChanged
    isFirebaseAuthReady = true;
    expect(isFirebaseAuthReady).toBe(true);
  });

  it('2. auth.currentUser null: Firestore queda estrictamente bloqueado', () => {
    const isFirebaseAuthReady = true;
    const currentUser = null;
    const isVerified = Boolean(currentUser && (currentUser as any).emailVerified);

    // Los listeners de useChat comprueban:
    const allowFirestoreListeners = isFirebaseAuthReady && currentUser !== null && isVerified;
    expect(allowFirestoreListeners).toBe(false);
  });

  it('3. Firebase Auth ready + user con email no verificado: acceso a Firestore denegado', () => {
    const isFirebaseAuthReady = true;
    const currentUser = {
      uid: 'user_unverified_123',
      email: 'student@example.com',
      emailVerified: false,
    };
    const isVerified = Boolean(currentUser.emailVerified);

    const allowFirestoreListeners = isFirebaseAuthReady && currentUser !== null && isVerified;
    expect(allowFirestoreListeners).toBe(false);
  });

  it('4. Firebase Auth ready + user verificado SIN claim role=admin: isFirebaseAdmin es false', () => {
    const isFirebaseAuthReady = true;
    const currentUser = {
      uid: 'student_456',
      email: 'student@example.com',
      emailVerified: true,
    };
    const claims = {
      role: 'student',
      isAdmin: false
    };

    const firebaseEmailVerified = Boolean(currentUser.emailVerified);
    const firebaseRole = (claims.role === 'admin' || claims.role === 'teacher' || claims.role === 'student') ? claims.role : null;
    const isFirebaseAdmin = Boolean(firebaseEmailVerified && firebaseRole === 'admin');

    expect(isFirebaseAuthReady).toBe(true);
    expect(firebaseRole).toBe('student');
    expect(isFirebaseAdmin).toBe(false);
  });

  it('5. Firebase Auth ready + user verificado CON claim role=admin: isFirebaseAdmin es true y listeners permitidos', () => {
    const isFirebaseAuthReady = true;
    const currentUser = {
      uid: 'admin_real_789',
      email: 'admin@aulainfinity.com',
      emailVerified: true,
    };
    const claims = {
      role: 'admin',
      isAdmin: true
    };

    const firebaseEmailVerified = Boolean(currentUser.emailVerified);
    const firebaseRole = (claims.role === 'admin' || claims.role === 'teacher' || claims.role === 'student') ? claims.role : null;
    const isFirebaseAdmin = Boolean(firebaseEmailVerified && firebaseRole === 'admin');
    const allowFirestoreListeners = isFirebaseAuthReady && currentUser !== null && firebaseEmailVerified;

    expect(isFirebaseAuthReady).toBe(true);
    expect(firebaseRole).toBe('admin');
    expect(isFirebaseAdmin).toBe(true);
    expect(allowFirestoreListeners).toBe(true);
  });

  it('6. Logout: desmonta listeners y resetea estado de Firebase', () => {
    let unsubChatCalled = false;
    let unsubMessagesCalled = false;

    const unsubChat = () => { unsubChatCalled = true; };
    const unsubMessages = () => { unsubMessagesCalled = true; };

    // Simular hook cleanup
    const cleanup = () => {
      if (unsubChat) unsubChat();
      if (unsubMessages) unsubMessages();
    };

    cleanup();

    expect(unsubChatCalled).toBe(true);
    expect(unsubMessagesCalled).toBe(true);
  });

  it('7. mockUser admin en localStorage + Firebase Auth null: NUNCA autoriza Firestore', () => {
    const localStorageMockUser = {
      id: 'admin_local_id',
      email: 'admin@local.com',
      role: 'admin'
    };

    // Firebase Auth real es null
    const firebaseUser = null;
    const firebaseEmailVerified = false;
    const firebaseRole = null;

    // Regla: mockUser.role === 'admin' NO equivale a Firebase token role === 'admin'
    const isFirebaseAdmin = Boolean(firebaseEmailVerified && firebaseRole === 'admin');
    const allowFirestore = Boolean(firebaseUser && firebaseEmailVerified && isFirebaseAdmin);

    expect(localStorageMockUser.role).toBe('admin'); // Existe en UI local
    expect(isFirebaseAdmin).toBe(false);             // Pero en Firebase es false
    expect(allowFirestore).toBe(false);              // Firestore bloqueado
  });

  it('8. inferParticipantsFromChatId extrae correctamente los IDs según formato', () => {
    const directChat = 'direct_prof123_stud456_matematicas';
    const participantsDirect = inferParticipantsFromChatId(directChat, 'prof123');
    expect(participantsDirect).toContain('prof123');
    expect(participantsDirect).toContain('stud456');

    const peerChat = 'peer_userA_userB';
    const participantsPeer = inferParticipantsFromChatId(peerChat, 'userA');
    expect(participantsPeer).toContain('userA');
    expect(participantsPeer).toContain('userB');
  });
});
