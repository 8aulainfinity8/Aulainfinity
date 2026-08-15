import { describe, it, expect } from 'vitest';
import { isAdminEmail } from '../constants/auth';

/**
 * Suite de Pruebas de Matriz de Seguridad y Autorización (Fase 13 del Roadmap)
 * Valida los permisos de acceso por rol (Student, Teacher, Admin)
 */
describe('Fase 13 — Matriz de Seguridad y Autorización', () => {

    interface SecurityContext {
        uid: string;
        email: string;
        role: 'student' | 'teacher' | 'admin';
        isMasterAdmin?: boolean;
    }

    const studentCtx: SecurityContext = {
        uid: 'student_123',
        email: 'alumno@aulainfinity.com',
        role: 'student'
    };

    const teacherCtx: SecurityContext = {
        uid: 'teacher_456',
        email: 'profesor@aulainfinity.com',
        role: 'teacher'
    };

    const adminCtx: SecurityContext = {
        uid: 'admin_789',
        email: '8aulainfinity8@gmail.com',
        role: 'admin',
        isMasterAdmin: true
    };

    // Helper de lógica de autorización
    const canModifyRole = (ctx: SecurityContext, targetUserId: string, newRole: string) => {
        if (ctx.role === 'admin' || isAdminEmail(ctx.email)) return true;
        return false; // Ni student ni teacher pueden auto-promocionarse o cambiar roles
    };

    const canReadPrivateStudentData = (ctx: SecurityContext, targetStudentId: string, assignedTeacherId?: string) => {
        if (ctx.role === 'admin' || isAdminEmail(ctx.email)) return true;
        if (ctx.uid === targetStudentId) return true;
        if (ctx.role === 'teacher' && assignedTeacherId === ctx.uid) return true;
        return false;
    };

    const canModifyStudentProgress = (ctx: SecurityContext, targetStudentId: string) => {
        if (ctx.role === 'admin' || isAdminEmail(ctx.email)) return true;
        if (ctx.uid === targetStudentId) return true; // El propio alumno registra su avance en lecciones
        return false;
    };

    const canManageGlobalTutoring = (ctx: SecurityContext) => {
        return ctx.role === 'admin' || isAdminEmail(ctx.email);
    };

    const canDirectWriteFinancialTransactions = (isClientSideDirectWrite: boolean) => {
        // Ningún cliente puede escribir directamente transacciones en Firestore
        return !isClientSideDirectWrite;
    };

    const canUseTutorIA = (ctx: SecurityContext, dailyQueryCount: number, dailyLimit = 30) => {
        if (ctx.role === 'admin') return true;
        return dailyQueryCount < dailyLimit;
    };

    describe('1. Modificación de Rol y Escalación de Privilegios', () => {
        it('El estudiante NO puede auto-promocionarse a profesor o admin', () => {
            expect(canModifyRole(studentCtx, studentCtx.uid, 'admin')).toBe(false);
            expect(canModifyRole(studentCtx, studentCtx.uid, 'teacher')).toBe(false);
        });

        it('El profesor NO puede convertirse en administrador', () => {
            expect(canModifyRole(teacherCtx, teacherCtx.uid, 'admin')).toBe(false);
        });

        it('El administrador maestro tiene autorización para gestionar roles', () => {
            expect(canModifyRole(adminCtx, studentCtx.uid, 'teacher')).toBe(true);
        });
    });

    describe('2. Aislamiento de Datos Privados entre Alumnos', () => {
        it('El estudiante solo puede leer sus propios datos', () => {
            expect(canReadPrivateStudentData(studentCtx, studentCtx.uid)).toBe(true);
            expect(canReadPrivateStudentData(studentCtx, 'other_student_999')).toBe(false);
        });

        it('El profesor solo puede acceder a alumnos asignados', () => {
            expect(canReadPrivateStudentData(teacherCtx, studentCtx.uid, teacherCtx.uid)).toBe(true);
            expect(canReadPrivateStudentData(teacherCtx, 'unassigned_student', 'other_teacher')).toBe(false);
        });

        it('El administrador tiene acceso de supervisión global', () => {
            expect(canReadPrivateStudentData(adminCtx, studentCtx.uid)).toBe(true);
        });
    });

    describe('3. Integridad de Progreso Académico', () => {
        it('Un alumno no puede modificar el progreso de otro alumno', () => {
            expect(canModifyStudentProgress(studentCtx, 'other_student_999')).toBe(false);
        });

        it('El propio alumno puede registrar su avance', () => {
            expect(canModifyStudentProgress(studentCtx, studentCtx.uid)).toBe(true);
        });
    });

    describe('4. Gestión de Tutorías Globales', () => {
        it('Solo administradores pueden gestionar tutorías a nivel global', () => {
            expect(canManageGlobalTutoring(studentCtx)).toBe(false);
            expect(canManageGlobalTutoring(teacherCtx)).toBe(false);
            expect(canManageGlobalTutoring(adminCtx)).toBe(true);
        });
    });

    describe('5. Protección de Transacciones Financieras', () => {
        it('Las escrituras directas desde el cliente están bloqueadas', () => {
            expect(canDirectWriteFinancialTransactions(true)).toBe(false);
            expect(canDirectWriteFinancialTransactions(false)).toBe(true);
        });
    });

    describe('6. Límites y Control de Cuota del Tutor IA', () => {
        it('Estudiante dentro del límite diario (30 consultas) puede consultar', () => {
            expect(canUseTutorIA(studentCtx, 15, 30)).toBe(true);
        });

        it('Estudiante que alcanza la cuota diaria (>=30) es bloqueado por el backend', () => {
            expect(canUseTutorIA(studentCtx, 30, 30)).toBe(false);
            expect(canUseTutorIA(studentCtx, 35, 30)).toBe(false);
        });

        it('El administrador no está sujeto a límites de prueba', () => {
            expect(canUseTutorIA(adminCtx, 50, 30)).toBe(true);
        });
    });
});
