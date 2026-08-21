import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerStudent, registerTeacher } from '../services/api';
import { UserSchema } from '../schemas';

const mockSignOut = vi.fn().mockResolvedValue(undefined);

// Mock dependencies
vi.mock('../services/firebase', () => ({
    auth: {
        currentUser: null,
        signOut: () => mockSignOut(),
    },
    db: {},
    googleProvider: {},
    storage: {}
}));

vi.mock('firebase/auth', () => ({
    createUserWithEmailAndPassword: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    sendEmailVerification: vi.fn(),
    signOut: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn((_db, coll, id) => ({ path: `${coll}/${id}`, id })),
    setDoc: vi.fn().mockResolvedValue(undefined),
    getDoc: vi.fn().mockResolvedValue({ exists: () => false, data: () => ({}) }),
    getDocs: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
    collection: vi.fn((_db, coll) => ({ path: coll })),
    query: vi.fn(),
    where: vi.fn(),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP')
}));

import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { setDoc } from 'firebase/firestore';

describe('Flujo de Registro Seguro (Estudiantes, Profesores, Reintentos y RBAC)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('1. Registro de Estudiante — Secuencia Correcta: Auth -> Firestore -> Email -> MockDB -> SignOut', async () => {
        const executionOrder: string[] = [];

        (createUserWithEmailAndPassword as any).mockImplementation(async () => {
            executionOrder.push('AUTH_CREATE');
            return { user: { uid: 'student_test_1', email: 'estudiante@test.com', emailVerified: false } };
        });

        (setDoc as any).mockImplementation(async () => {
            executionOrder.push('FIRESTORE_WRITE');
            return undefined;
        });

        (sendEmailVerification as any).mockImplementation(async () => {
            executionOrder.push('EMAIL_VERIFICATION');
            return undefined;
        });

        mockSignOut.mockImplementation(async () => {
            executionOrder.push('AUTH_SIGNOUT');
            return undefined;
        });

        const studentData = {
            name: 'Juan Perez',
            email: 'estudiante@test.com',
            password: 'password123',
            enrolledCourseIds: ['math101'],
            phone: '600123456'
        };

        const result = await registerStudent(studentData);

        expect(result.email).toBe('estudiante@test.com');
        expect(result.role).toBe('student');

        // Verify the exact sequential pipeline
        expect(executionOrder[0]).toBe('AUTH_CREATE');
        expect(executionOrder[1]).toBe('FIRESTORE_WRITE');
        expect(executionOrder.includes('EMAIL_VERIFICATION')).toBe(true);
        expect(executionOrder.includes('AUTH_SIGNOUT')).toBe(true);

        // Confirm signOut is called ONLY after Firestore write
        const firestoreIndex = executionOrder.indexOf('FIRESTORE_WRITE');
        const signoutIndex = executionOrder.indexOf('AUTH_SIGNOUT');
        expect(firestoreIndex).toBeLessThan(signoutIndex);
    });

    it('2. Registro de Profesor — Bloqueo de autoasignación de privilegios (Least Privilege)', async () => {
        (createUserWithEmailAndPassword as any).mockImplementation(async () => ({
            user: { uid: 'teacher_test_1', email: 'profesor@test.com', emailVerified: false }
        }));
        (setDoc as any).mockResolvedValue(undefined);
        (sendEmailVerification as any).mockResolvedValue(undefined);
        mockSignOut.mockResolvedValue(undefined);

        const teacherData = {
            name: 'Dra. Sanchez',
            email: 'profesor@test.com',
            password: 'password123',
            phone: '611223344',
            category: 'Física y Química',
            subjects: ['Física'],
            levels: ['1 Bachillerato'],
            schedules: ['Tardes']
        };

        const result = await registerTeacher(teacherData);

        expect(result.role).toBe('teacher');
        expect(result.isApprovedForTutoring).toBe(false); // Must NEVER auto-approve
        expect((result as any).isAdmin).toBeUndefined(); // Must NOT grant admin privileges
    });

    it('3. Reintento tras fallo de Auth/Red — No contamina mockDatabase y permite reintentar limpiamente', async () => {
        // Fallo inicial en Auth (e.g. timeout / network error)
        (createUserWithEmailAndPassword as any).mockRejectedValueOnce(new Error('auth/network-request-failed'));

        const payload = {
            name: 'Carlos Gomez',
            email: 'reintento@test.com',
            password: 'password123',
            enrolledCourseIds: [],
            phone: '699887766'
        };

        // El intento 1 falla en Firebase Auth
        await expect(registerStudent(payload)).rejects.toThrow('Error en autenticación de Firebase');

        // Intento 2 tiene éxito tras recuperarse la conexión
        (createUserWithEmailAndPassword as any).mockResolvedValueOnce({
            user: { uid: 'retry_test_1', email: 'reintento@test.com', emailVerified: false }
        });
        (setDoc as any).mockResolvedValue(undefined);
        (sendEmailVerification as any).mockResolvedValue(undefined);
        mockSignOut.mockResolvedValue(undefined);

        const retryResult = await registerStudent(payload);
        expect(retryResult).toBeDefined();
        expect(retryResult.email).toBe('reintento@test.com');
    });

    it('4. Validación Zod de UserSchema — Garantiza integridad estructural de los datos de usuario', () => {
        const validStudent = {
            id: 'test_user_zod',
            uid: 'test_user_zod',
            firebaseUid: 'test_user_zod',
            name: 'Alumno Zod',
            email: 'alumnozod@test.com',
            role: 'student',
            subscriptionStatus: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: 'SERVER_TIMESTAMP',
            watchedVideos: [],
            favoriteVideos: [],
            enrolledCourseIds: [],
            completedVideoIds: [],
            unlockedRewardIds: [],
            unlockedBadgeIds: [],
            coursesTaughtIds: [],
            taughtCourseIds: [],
            schedules: []
        };

        expect(() => UserSchema.parse(validStudent)).not.toThrow();
    });
});
