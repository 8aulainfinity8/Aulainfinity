import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

// Mock dependencies for firestoreSync tests
vi.mock('../services/firebase', () => ({
    db: {},
    auth: {
        currentUser: null
    }
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn((_db, collection, id) => ({ collection, id })),
    serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
    setDoc: vi.fn(() => Promise.resolve()),
    onSnapshot: vi.fn()
}));

vi.mock('../services/mockDatabase', () => ({
    userSeenStates: {},
    dbMock: {
        userSeenStates: {}
    }
}));

vi.mock('../services/eventService', () => ({
    eventEmitter: {
        emit: vi.fn()
    }
}));

import { syncUserSeenStatesToFirestore } from '../services/firestoreSync';
import { auth } from '../services/firebase';
import { setDoc } from 'firebase/firestore';

describe('Pruebas de Sincronización de Estados Vistos (User Seen States)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Default unauthenticated
        (auth as any).currentUser = null;
    });

    it('1. Usuario no autenticado (auth.currentUser = null) → NO ejecuta escritura en Firestore', async () => {
        (auth as any).currentUser = null;

        await syncUserSeenStatesToFirestore({ seenStudentUserIds: ['user1'] });

        expect(setDoc).not.toHaveBeenCalled();
    });

    it('2. Usuario autenticado pero correo NO verificado (emailVerified = false) → NO ejecuta escritura en Firestore', async () => {
        (auth as any).currentUser = {
            uid: 'student_unverified_123',
            emailVerified: false
        };

        await syncUserSeenStatesToFirestore({ seenStudentUserIds: ['user1'] });

        expect(setDoc).not.toHaveBeenCalled();
    });

    it('3. Usuario autenticado con correo verificado (emailVerified = true) → Sincroniza su propio UID', async () => {
        (auth as any).currentUser = {
            uid: 'student_verified_456',
            emailVerified: true
        };

        await syncUserSeenStatesToFirestore({ seenStudentUserIds: ['user1'] });

        expect(setDoc).toHaveBeenCalledTimes(1);
        const [docRef, data, options] = (setDoc as any).mock.calls[0];
        expect(docRef).toEqual({ collection: 'firestore_user_seen_states', id: 'student_verified_456' });
        expect(data).toMatchObject({
            seenStudentUserIds: ['user1'],
            updatedAt: 'MOCK_TIMESTAMP'
        });
        expect(options).toEqual({ merge: true });
    });

    it('4. Manejo elegante de permission-denied → No lanza excepción ni muestra warning', async () => {
        (auth as any).currentUser = {
            uid: 'student_verified_456',
            emailVerified: true
        };

        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        (setDoc as any).mockRejectedValueOnce({ code: 'permission-denied', message: 'Missing or insufficient permissions.' });

        await expect(syncUserSeenStatesToFirestore({ seenStudentUserIds: ['user1'] })).resolves.not.toThrow();
        expect(consoleWarnSpy).not.toHaveBeenCalled();

        consoleWarnSpy.mockRestore();
    });

    it('5. Verificación de Reglas de Firestore: Aislamiento de propietario, isVerifiedUser y Admin', () => {
        const rulesContent = readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');

        expect(rulesContent).toContain('match /firestore_user_seen_states/{userId}');
        expect(rulesContent).toContain('allow read, write: if isVerifiedUser() && (isOwner(userId) || isAdmin());');
    });

    it('6. Ausencia total de referencias a firestore_user_seen_states/main en el proyecto', () => {
        const firestoreSyncContent = readFileSync(path.join(process.cwd(), 'src/services/firestoreSync.ts'), 'utf8');

        expect(firestoreSyncContent).not.toContain("firestore_user_seen_states', 'main'");
        expect(firestoreSyncContent).not.toContain('firestore_user_seen_states/main');
    });
});
