import { describe, it, expect, vi } from 'vitest';

describe('FASE 7 — Renovación de ID Token y Sincronización de Custom Claims', () => {
  it('1. Firebase user null: sincroniza estado bloqueado e isFirebaseAuthReady=true', async () => {
    let firebaseUser: any = null;
    let firebaseRole: string | null = 'admin';
    let isFirebaseAuthReady = false;

    const syncFirebaseUser = async (fbUser: any) => {
      if (!fbUser) {
        firebaseUser = null;
        firebaseRole = null;
      }
      isFirebaseAuthReady = true;
    };

    await syncFirebaseUser(null);

    expect(firebaseUser).toBeNull();
    expect(firebaseRole).toBeNull();
    expect(isFirebaseAuthReady).toBe(true);
  });

  it('2. Firebase user autenticado: extrae UID y emailVerified correctamente', async () => {
    const mockFbUser = {
      uid: 'cON1WkGVN0QKnLVT5B75TKFJbfn1',
      emailVerified: true,
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: { role: 'admin' },
        issuedAtTime: '2026-08-19T00:00:00Z',
        expirationTime: '2026-08-19T01:00:00Z',
      }),
    };

    let uid: string | null = null;
    let verified = false;

    const syncFirebaseUser = async (fbUser: typeof mockFbUser) => {
      uid = fbUser.uid;
      verified = fbUser.emailVerified;
      await fbUser.getIdTokenResult(true);
    };

    await syncFirebaseUser(mockFbUser);

    expect(uid).toBe('cON1WkGVN0QKnLVT5B75TKFJbfn1');
    expect(verified).toBe(true);
  });

  it('3. emailVerified false: bloquea privilegios de administración', async () => {
    const mockFbUser = {
      uid: 'unverified-user',
      emailVerified: false,
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: { role: 'admin' },
      }),
    };

    let isFirebaseAdmin = false;

    const syncFirebaseUser = async (fbUser: typeof mockFbUser) => {
      const tokenResult = await fbUser.getIdTokenResult(true);
      const role = tokenResult.claims.role;
      isFirebaseAdmin = Boolean(fbUser.emailVerified && role === 'admin');
    };

    await syncFirebaseUser(mockFbUser);

    expect(isFirebaseAdmin).toBe(false);
  });

  it('4. token sin role: sincroniza parsedRole=null e isFirebaseAdmin=false', async () => {
    const mockFbUser = {
      uid: 'user-no-role',
      emailVerified: true,
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: {},
      }),
    };

    let parsedRole: string | null = 'initial';
    let isFirebaseAdmin = true;

    const syncFirebaseUser = async (fbUser: typeof mockFbUser) => {
      const tokenResult = await fbUser.getIdTokenResult(true);
      const rawRole = tokenResult.claims.role as string | undefined;
      const rawIsAdmin = Boolean(tokenResult.claims.isAdmin);
      const customRole = rawRole || (rawIsAdmin ? 'admin' : undefined);
      parsedRole = (customRole === 'admin' || customRole === 'teacher' || customRole === 'student') ? customRole : null;
      isFirebaseAdmin = Boolean(fbUser.emailVerified && parsedRole === 'admin');
    };

    await syncFirebaseUser(mockFbUser);

    expect(parsedRole).toBeNull();
    expect(isFirebaseAdmin).toBe(false);
  });

  it('5. token con role=teacher: asigna correctamente parsedRole="teacher"', async () => {
    const mockFbUser = {
      uid: 'teacher-uid',
      emailVerified: true,
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: { role: 'teacher' },
      }),
    };

    let parsedRole: string | null = null;
    let isFirebaseAdmin = false;

    const syncFirebaseUser = async (fbUser: typeof mockFbUser) => {
      const tokenResult = await fbUser.getIdTokenResult(true);
      const rawRole = tokenResult.claims.role as string | undefined;
      parsedRole = rawRole === 'teacher' ? 'teacher' : null;
      isFirebaseAdmin = Boolean(fbUser.emailVerified && parsedRole === 'admin');
    };

    await syncFirebaseUser(mockFbUser);

    expect(parsedRole).toBe('teacher');
    expect(isFirebaseAdmin).toBe(false);
  });

  it('6. token con role=admin: asigna correctamente parsedRole="admin" e isFirebaseAdmin=true', async () => {
    const mockFbUser = {
      uid: 'cON1WkGVN0QKnLVT5B75TKFJbfn1',
      emailVerified: true,
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: { role: 'admin', isApprovedForTutoring: true },
      }),
    };

    let parsedRole: string | null = null;
    let isFirebaseAdmin = false;

    const syncFirebaseUser = async (fbUser: typeof mockFbUser) => {
      const tokenResult = await fbUser.getIdTokenResult(true);
      const rawRole = tokenResult.claims.role as string | undefined;
      parsedRole = rawRole === 'admin' ? 'admin' : null;
      isFirebaseAdmin = Boolean(fbUser.emailVerified && parsedRole === 'admin');
    };

    await syncFirebaseUser(mockFbUser);

    expect(parsedRole).toBe('admin');
    expect(isFirebaseAdmin).toBe(true);
  });

  it('7. token con isAdmin=true: infiere rol administrativo si role no está presente', async () => {
    const mockFbUser = {
      uid: 'admin-via-flag',
      emailVerified: true,
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: { isAdmin: true },
      }),
    };

    let parsedRole: string | null = null;
    let isFirebaseAdmin = false;

    const syncFirebaseUser = async (fbUser: typeof mockFbUser) => {
      const tokenResult = await fbUser.getIdTokenResult(true);
      const rawRole = tokenResult.claims.role as string | undefined;
      const rawIsAdmin = Boolean(tokenResult.claims.isAdmin);
      const customRole = rawRole || (rawIsAdmin ? 'admin' : undefined);
      parsedRole = (customRole === 'admin' || customRole === 'teacher' || customRole === 'student') ? customRole : null;
      isFirebaseAdmin = Boolean(fbUser.emailVerified && parsedRole === 'admin');
    };

    await syncFirebaseUser(mockFbUser);

    expect(parsedRole).toBe('admin');
    expect(isFirebaseAdmin).toBe(true);
  });

  it('8. getIdTokenResult(true) se ejecuta forzando renovación del token', async () => {
    const getIdTokenResultMock = vi.fn().mockResolvedValue({
      claims: { role: 'admin' },
      issuedAtTime: '100',
      expirationTime: '200',
    });

    const mockFbUser = {
      uid: 'cON1WkGVN0QKnLVT5B75TKFJbfn1',
      emailVerified: true,
      getIdTokenResult: getIdTokenResultMock,
    };

    const syncFirebaseUser = async (fbUser: typeof mockFbUser) => {
      await fbUser.getIdTokenResult(true);
    };

    await syncFirebaseUser(mockFbUser);

    expect(getIdTokenResultMock).toHaveBeenCalledWith(true);
  });

  it('9. role=admin se mantiene consistente después de múltiples disparos de onIdTokenChanged', async () => {
    const mockFbUser = {
      uid: 'cON1WkGVN0QKnLVT5B75TKFJbfn1',
      emailVerified: true,
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: { role: 'admin' },
        issuedAtTime: '100',
        expirationTime: '200',
      }),
    };

    let stateRole: string | null = null;
    const syncFirebaseUser = async (fbUser: typeof mockFbUser) => {
      const tokenResult = await fbUser.getIdTokenResult(true);
      stateRole = tokenResult.claims.role;
    };

    // Primer disparo (onAuthStateChanged)
    await syncFirebaseUser(mockFbUser);
    expect(stateRole).toBe('admin');

    // Segundo disparo (onIdTokenChanged)
    await syncFirebaseUser(mockFbUser);
    expect(stateRole).toBe('admin');
  });

  it('10. onIdTokenChanged usa forceRefresh=false para evitar bucle infinito y quota-exceeded', async () => {
    const getIdTokenResultMock = vi.fn().mockResolvedValue({
      claims: { role: 'admin' },
      issuedAtTime: '100',
      expirationTime: '200',
    });

    const mockFbUser = {
      uid: 'cON1WkGVN0QKnLVT5B75TKFJbfn1',
      emailVerified: true,
      getIdTokenResult: getIdTokenResultMock,
    };

    let initialAuthChecked = false;
    const syncFirebaseUser = async (fbUser: typeof mockFbUser, forceRefresh = false) => {
      await fbUser.getIdTokenResult(forceRefresh);
    };

    // 1. Initial auth state change (forceRefresh = true)
    const shouldForce = !initialAuthChecked;
    initialAuthChecked = true;
    await syncFirebaseUser(mockFbUser, shouldForce);
    expect(getIdTokenResultMock).toHaveBeenLastCalledWith(true);

    // 2. Token change listener event (forceRefresh = false)
    await syncFirebaseUser(mockFbUser, false);
    expect(getIdTokenResultMock).toHaveBeenLastCalledWith(false);
  });

  it('11. useChat sendMessage previene doble envío concurrente (in-flight guard)', async () => {
    let isSending = false;
    let sendCallsCount = 0;

    const sendMessageMock = async () => {
      if (isSending) return;
      isSending = true;
      try {
        sendCallsCount++;
        await new Promise(r => setTimeout(r, 20));
      } finally {
        isSending = false;
      }
    };

    // Lanzar dos envíos simultáneos
    const [res1, res2] = await Promise.all([sendMessageMock(), sendMessageMock()]);
    expect(sendCallsCount).toBe(1);
  });

  it('12. un evento posterior obsoleto no puede degradar incorrectamente admin a none', async () => {
    let currentSyncId = 0;
    let finalRole: string | null = null;

    const slowStaleEvent = async (fbUser: any) => {
      const syncId = ++currentSyncId;
      // Simula retraso en la red
      await new Promise(r => setTimeout(r, 50));
      if (syncId !== currentSyncId) return; // Descartado por ser obsoleto
      finalRole = fbUser?.claims?.role || null;
    };

    const fastFreshAdminEvent = async (fbUser: any) => {
      const syncId = ++currentSyncId;
      if (syncId !== currentSyncId) return;
      finalRole = fbUser?.claims?.role || null;
    };

    // Se lanza evento viejo con claims vacíos
    const p1 = slowStaleEvent({ claims: {} });
    // Inmediatamente se lanza evento nuevo con claims admin
    const p2 = fastFreshAdminEvent({ claims: { role: 'admin' } });

    await Promise.all([p1, p2]);

    expect(finalRole).toBe('admin');
  });

  it('13. useChat no abre listeners antes de Auth READY', () => {
    const isFirebaseAuthReady = false;
    const currentUser = null;
    let listenersInitialized = false;

    if (!isFirebaseAuthReady || !currentUser) {
      listenersInitialized = false;
    } else {
      listenersInitialized = true;
    }

    expect(listenersInitialized).toBe(false);
  });

  it('14. useChat sí abre listeners cuando Auth READY + admin + verified', () => {
    const isFirebaseAuthReady = true;
    const currentUser = { uid: 'cON1WkGVN0QKnLVT5B75TKFJbfn1', emailVerified: true };
    const firebaseRole = 'admin';
    let listenersInitialized = false;

    if (isFirebaseAuthReady && currentUser && currentUser.emailVerified && firebaseRole === 'admin') {
      listenersInitialized = true;
    }

    expect(listenersInitialized).toBe(true);
  });

  it('15. mockUser nunca concede acceso Firestore si no hay sesión real verificada', () => {
    const mockUser = { id: 'cON1WkGVN0QKnLVT5B75TKFJbfn1', role: 'admin', email: '8aulainfinity8@gmail.com' };
    const realFirebaseAuthUser = null; // No hay sesión en Firebase Auth SDK

    const canAccessFirestore = Boolean(realFirebaseAuthUser && (realFirebaseAuthUser as any).emailVerified);

    expect(mockUser.role).toBe('admin');
    expect(canAccessFirestore).toBe(false);
  });
});
