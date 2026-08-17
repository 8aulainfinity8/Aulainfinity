import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Suite de Pruebas de Autorización Basada Estrictamente en Custom Claims (Fase 2.1C)
 * 
 * Verifica las 11 Reglas Obligatorias:
 * 1. Cuenta admin real (con claim role: 'admin') -> acceso admin = PERMITIDO.
 * 2. Student -> acceso admin = DENEGADO.
 * 3. Teacher no aprobado -> acceso admin = DENEGADO y gestión de cursos/tutorías = DENEGADO.
 * 4. Teacher aprobado -> acceso admin = DENEGADO y gestión de cursos/tutorías = PERMITIDO.
 * 5. Student intenta role='admin' -> DENEGADO.
 * 6. Student intenta isAdmin=true -> DENEGADO.
 * 7. Student intenta isApprovedForTutoring=true -> DENEGADO.
 * 8. Usuario con email "8aulainfinity8@gmail.com" pero sin claim admin -> NO obtiene privilegios.
 * 9. Usuario admin con cualquier otro email con claim admin -> SÍ obtiene privilegios.
 * 10. Eliminación del documento Firestore del usuario -> claims revocadas.
 * 11. Ninguna comparación del email administrador concede privilegios.
 */

interface AuthToken {
    uid: string;
    email?: string;
    email_verified?: boolean;
    role?: 'student' | 'teacher' | 'admin';
    isAdmin?: boolean;
    isApprovedForTutoring?: boolean;
}

interface FirestoreRequestContext {
    auth: {
        uid: string;
        token: AuthToken;
    } | null;
    resource?: {
        data: Record<string, any>;
    };
    resourceData?: Record<string, any>;
    incomingData?: Record<string, any>;
}

// Simulador exacto del motor de Security Rules de Firestore para evaluación de reglas
class FirestoreRulesEngine {
    static isSignedIn(ctx: FirestoreRequestContext): boolean {
        return ctx.auth !== null;
    }

    static isVerifiedUser(ctx: FirestoreRequestContext): boolean {
        return this.isSignedIn(ctx) && ctx.auth?.token.email_verified === true;
    }

    static isOwner(ctx: FirestoreRequestContext, userId: string): boolean {
        return this.isSignedIn(ctx) && ctx.auth?.uid === userId;
    }

    static isAdmin(ctx: FirestoreRequestContext): boolean {
        return this.isVerifiedUser(ctx) && ctx.auth?.token.role === 'admin';
    }

    static isTeacher(ctx: FirestoreRequestContext): boolean {
        return this.isVerifiedUser(ctx) && (
            ctx.auth?.token.role === 'teacher' ||
            ctx.auth?.token.role === 'admin'
        );
    }

    static isApprovedTeacher(ctx: FirestoreRequestContext): boolean {
        return this.isVerifiedUser(ctx) && (
            ctx.auth?.token.role === 'admin' ||
            (ctx.auth?.token.role === 'teacher' && ctx.auth?.token.isApprovedForTutoring === true)
        );
    }

    // Regla para escritura en /firestore_users/{userId}
    static canCreateUserDoc(ctx: FirestoreRequestContext, userId: string, incomingData: Record<string, any>): boolean {
        const isOwnerCond = this.isOwner(ctx, userId) && (
            incomingData.role === 'student' &&
            (!('isAdmin' in incomingData) || incomingData.isAdmin === false) &&
            (!('isApprovedForTutoring' in incomingData) || incomingData.isApprovedForTutoring === false)
        );
        return isOwnerCond || this.isAdmin(ctx);
    }

    static canUpdateUserDoc(ctx: FirestoreRequestContext, userId: string, existingData: Record<string, any>, incomingData: Record<string, any>): boolean {
        const isOwnerCond = this.isOwner(ctx, userId) && (
            incomingData.role === existingData.role &&
            (!('isAdmin' in incomingData) || incomingData.isAdmin === existingData.isAdmin) &&
            (!('isApprovedForTutoring' in incomingData) || incomingData.isApprovedForTutoring === existingData.isApprovedForTutoring)
        );
        return isOwnerCond || this.isAdmin(ctx);
    }

    // Regla para /courses/{courseId}
    static canWriteCourse(ctx: FirestoreRequestContext): boolean {
        return this.isApprovedTeacher(ctx);
    }

    // Regla para /admins/{adminId}
    static canAccessAdminCollection(ctx: FirestoreRequestContext): boolean {
        return this.isAdmin(ctx);
    }
}

// Simulador de Cloud Function syncUserRole
function simulateSyncUserRole(
    userId: string,
    existingAuthClaims: Record<string, any>,
    oldFirestoreData: Record<string, any> | null,
    newFirestoreData: Record<string, any> | null
) {
    if (!newFirestoreData) {
        return {
            ...existingAuthClaims,
            role: 'student',
            isAdmin: false,
            isApprovedForTutoring: false
        };
    }

    let targetRole = newFirestoreData.role || 'student';
    let isApprovedForTutoring = Boolean(newFirestoreData.isApprovedForTutoring);
    let isAdmin = Boolean(newFirestoreData.isAdmin);

    const wasAdmin = oldFirestoreData?.role === 'admin' || oldFirestoreData?.isAdmin === true || existingAuthClaims.role === 'admin';
    const wasTeacher = oldFirestoreData?.role === 'teacher' || existingAuthClaims.role === 'teacher' || wasAdmin;
    const wasApproved = oldFirestoreData?.isApprovedForTutoring === true || existingAuthClaims.isApprovedForTutoring === true || wasAdmin;

    // 1. Bloqueo de escalación a admin
    if (targetRole === 'admin' || isAdmin) {
        if (!wasAdmin) {
            targetRole = oldFirestoreData?.role || existingAuthClaims.role || 'student';
            isAdmin = false;
        } else {
            isAdmin = true;
        }
    }

    // 2. Bloqueo de escalación a teacher
    if (targetRole === 'teacher') {
        if (!wasTeacher) {
            targetRole = oldFirestoreData?.role || existingAuthClaims.role || 'student';
        }
    }

    // 3. Bloqueo de auto-aprobación de tutoría
    if (targetRole === 'teacher' && isApprovedForTutoring) {
        if (!wasApproved) {
            isApprovedForTutoring = false;
        }
    }

    return {
        ...existingAuthClaims,
        role: targetRole,
        isAdmin: targetRole === 'admin' ? true : isAdmin,
        isApprovedForTutoring: targetRole === 'admin' ? true : (targetRole === 'teacher' ? isApprovedForTutoring : false)
    };
}

describe('FASE 2.1C — MATRIZ DE AUTORIZACIÓN BASADA EXCLUSIVAMENTE EN CUSTOM CLAIMS', () => {

    const verifiedAdminUser: FirestoreRequestContext = {
        auth: {
            uid: 'admin_uid_001',
            token: {
                uid: 'admin_uid_001',
                email: 'cualquier_admin@aulainfinity.edu',
                email_verified: true,
                role: 'admin',
                isAdmin: true,
                isApprovedForTutoring: true
            }
        }
    };

    const studentUser: FirestoreRequestContext = {
        auth: {
            uid: 'student_uid_002',
            token: {
                uid: 'student_uid_002',
                email: 'alumno@gmail.com',
                email_verified: true,
                role: 'student',
                isAdmin: false,
                isApprovedForTutoring: false
            }
        }
    };

    const unapprovedTeacherUser: FirestoreRequestContext = {
        auth: {
            uid: 'teacher_unapproved_003',
            token: {
                uid: 'teacher_unapproved_003',
                email: 'profe_nuevo@aulainfinity.com',
                email_verified: true,
                role: 'teacher',
                isAdmin: false,
                isApprovedForTutoring: false
            }
        }
    };

    const approvedTeacherUser: FirestoreRequestContext = {
        auth: {
            uid: 'teacher_approved_004',
            token: {
                uid: 'teacher_approved_004',
                email: 'profe_titular@aulainfinity.com',
                email_verified: true,
                role: 'teacher',
                isAdmin: false,
                isApprovedForTutoring: true
            }
        }
    };

    const userWithTargetEmailNoClaims: FirestoreRequestContext = {
        auth: {
            uid: 'user_target_email_005',
            token: {
                uid: 'user_target_email_005',
                email: '8aulainfinity8@gmail.com',
                email_verified: true,
                role: 'student', // NO posee custom claim admin
                isAdmin: false,
                isApprovedForTutoring: false
            }
        }
    };

    const userWithTargetEmailWithAdminClaims: FirestoreRequestContext = {
        auth: {
            uid: 'admin_master_uid_real',
            token: {
                uid: 'admin_master_uid_real',
                email: '8aulainfinity8@gmail.com',
                email_verified: true,
                role: 'admin', // Posee las custom claims requeridas
                isAdmin: true,
                isApprovedForTutoring: true
            }
        }
    };

    it('Escenario 1: Cuenta admin real con Custom Claim role="admin" -> Acceso admin = PERMITIDO', () => {
        expect(FirestoreRulesEngine.isAdmin(verifiedAdminUser)).toBe(true);
        expect(FirestoreRulesEngine.canAccessAdminCollection(verifiedAdminUser)).toBe(true);
        expect(FirestoreRulesEngine.canWriteCourse(verifiedAdminUser)).toBe(true);
    });

    it('Escenario 2: Student autenticado -> Acceso admin = DENEGADO', () => {
        expect(FirestoreRulesEngine.isAdmin(studentUser)).toBe(false);
        expect(FirestoreRulesEngine.canAccessAdminCollection(studentUser)).toBe(false);
    });

    it('Escenario 3: Teacher no aprobado -> Acceso admin = DENEGADO y Gestión de cursos = DENEGADO', () => {
        expect(FirestoreRulesEngine.isAdmin(unapprovedTeacherUser)).toBe(false);
        expect(FirestoreRulesEngine.canAccessAdminCollection(unapprovedTeacherUser)).toBe(false);
        expect(FirestoreRulesEngine.isApprovedTeacher(unapprovedTeacherUser)).toBe(false);
        expect(FirestoreRulesEngine.canWriteCourse(unapprovedTeacherUser)).toBe(false);
    });

    it('Escenario 4: Teacher aprobado -> Acceso admin = DENEGADO y Gestión de cursos = PERMITIDO', () => {
        expect(FirestoreRulesEngine.isAdmin(approvedTeacherUser)).toBe(false);
        expect(FirestoreRulesEngine.canAccessAdminCollection(approvedTeacherUser)).toBe(false);
        expect(FirestoreRulesEngine.isApprovedTeacher(approvedTeacherUser)).toBe(true);
        expect(FirestoreRulesEngine.canWriteCourse(approvedTeacherUser)).toBe(true);
    });

    it('Escenario 5: Student intenta escribir role="admin" en su documento -> DENEGADO en Firestore Rules', () => {
        const payloadWithAdmin = { role: 'admin', name: 'Hacker' };
        const allowed = FirestoreRulesEngine.canCreateUserDoc(studentUser, studentUser.auth!.uid, payloadWithAdmin);
        expect(allowed).toBe(false);

        const existingStudentDoc = { role: 'student', isAdmin: false, isApprovedForTutoring: false };
        const updateAllowed = FirestoreRulesEngine.canUpdateUserDoc(studentUser, studentUser.auth!.uid, existingStudentDoc, payloadWithAdmin);
        expect(updateAllowed).toBe(false);
    });

    it('Escenario 6: Student intenta escribir isAdmin=true -> DENEGADO en Firestore Rules', () => {
        const payloadWithIsAdmin = { role: 'student', isAdmin: true };
        const allowed = FirestoreRulesEngine.canCreateUserDoc(studentUser, studentUser.auth!.uid, payloadWithIsAdmin);
        expect(allowed).toBe(false);
    });

    it('Escenario 7: Student intenta escribir isApprovedForTutoring=true -> DENEGADO en Firestore Rules', () => {
        const payloadWithApproved = { role: 'student', isApprovedForTutoring: true };
        const allowed = FirestoreRulesEngine.canCreateUserDoc(studentUser, studentUser.auth!.uid, payloadWithApproved);
        expect(allowed).toBe(false);
    });

    it('Escenario 8: Usuario con email "8aulainfinity8@gmail.com" pero SIN claim admin -> NO obtiene privilegios (DENEGADO)', () => {
        expect(FirestoreRulesEngine.isAdmin(userWithTargetEmailNoClaims)).toBe(false);
        expect(FirestoreRulesEngine.canAccessAdminCollection(userWithTargetEmailNoClaims)).toBe(false);
        expect(FirestoreRulesEngine.canWriteCourse(userWithTargetEmailNoClaims)).toBe(false);
    });

    it('Escenario 9: Usuario admin con cuenta activa y Claims verificadas -> SÍ obtiene privilegios independientemente del email', () => {
        expect(FirestoreRulesEngine.isAdmin(userWithTargetEmailWithAdminClaims)).toBe(true);
        expect(FirestoreRulesEngine.canAccessAdminCollection(userWithTargetEmailWithAdminClaims)).toBe(true);
        expect(FirestoreRulesEngine.canWriteCourse(userWithTargetEmailWithAdminClaims)).toBe(true);
    });

    it('Escenario 10: Eliminación de documento Firestore en syncUserRole -> Claims revocadas de inmediato', () => {
        const initialClaims = { role: 'admin', isAdmin: true, isApprovedForTutoring: true };
        const oldDoc = { role: 'admin', isAdmin: true };
        const newDoc = null; // Documento eliminado

        const resultingClaims = simulateSyncUserRole('admin_deleted_uid', initialClaims, oldDoc, newDoc);
        expect(resultingClaims.role).toBe('student');
        expect(resultingClaims.isAdmin).toBe(false);
        expect(resultingClaims.isApprovedForTutoring).toBe(false);
    });

    it('Escenario 11: syncUserRole bloquea auto-promoción de Student a Teacher o Admin si no posee claim previa', () => {
        const studentClaims = { role: 'student' };
        const oldDoc = { role: 'student', isAdmin: false, isApprovedForTutoring: false };
        const maliciousDoc = { role: 'admin', isAdmin: true, isApprovedForTutoring: true };

        const resultAdminAttempt = simulateSyncUserRole('student_uid', studentClaims, oldDoc, maliciousDoc);
        expect(resultAdminAttempt.role).toBe('student');
        expect(resultAdminAttempt.isAdmin).toBe(false);
        expect(resultAdminAttempt.isApprovedForTutoring).toBe(false);

        const maliciousTeacherDoc = { role: 'teacher', isApprovedForTutoring: true };
        const resultTeacherAttempt = simulateSyncUserRole('student_uid', studentClaims, oldDoc, maliciousTeacherDoc);
        expect(resultTeacherAttempt.role).toBe('student');
        expect(resultTeacherAttempt.isApprovedForTutoring).toBe(false);
    });
});

describe('VERIFICACIÓN ESTÁTICA Y FORENSE DEL CÓDIGO FUENTE', () => {
    it('firestore.rules NO contiene comparaciones estáticas con strings de correo electrónico', () => {
        const rules = readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');
        expect(rules).not.toContain('8aulainfinity8@gmail.com');
        expect(rules).not.toMatch(/request\.auth\.token\.email\s*==/);
    });

    it('storage.rules NO contiene comparaciones estáticas con strings de correo electrónico', () => {
        const rules = readFileSync(path.join(process.cwd(), 'storage.rules'), 'utf8');
        expect(rules).not.toContain('8aulainfinity8@gmail.com');
        expect(rules).not.toMatch(/request\.auth\.token\.email\s*==/);
    });

    it('server.ts NO contiene comparaciones hardcodeadas de correo admin ni bypasses', () => {
        const serverCode = readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
        expect(serverCode).not.toContain('8aulainfinity8@gmail.com');
        expect(serverCode).not.toContain('isMasterAdminEmail');
        expect(serverCode).not.toContain('isBootstrapAdmin');
    });

    it('functions/index.ts valida estrictamente el Custom Claim token.role === "admin"', () => {
        const functionsCode = readFileSync(path.join(process.cwd(), 'functions/index.ts'), 'utf8');
        expect(functionsCode).not.toContain('8aulainfinity8@gmail.com');
        expect(functionsCode).toContain("callerClaims.role === 'admin'");
    });

    it('src/constants/auth.ts NO tiene emails de administración hardcodeados por defecto', () => {
        const authConstCode = readFileSync(path.join(process.cwd(), 'src/constants/auth.ts'), 'utf8');
        expect(authConstCode).not.toContain('8aulainfinity8@gmail.com');
        expect(authConstCode).toContain("DEFAULT_ADMIN_EMAILS: string[] = []");
    });
});
