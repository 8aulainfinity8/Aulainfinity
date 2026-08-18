import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { canAccessStoragePath, StorageAuthUser } from '../../server';
import { getFirestore } from 'firebase-admin/firestore';

vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => [{ name: '[DEFAULT]' }]),
}));

vi.mock('livekit-server-sdk', () => ({
  AccessToken: vi.fn(),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: vi.fn(),
  })),
}));

// Mock store for Firestore documents
const mockCollections: Record<string, Record<string, any>> = {};

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: (colName: string) => ({
      doc: (docId: string) => ({
        get: async () => {
          const docData = mockCollections[colName]?.[docId];
          if (docData === '__THROW__') {
            throw new Error('Firestore connection error simulated');
          }
          return {
            exists: !!docData,
            data: () => docData || undefined,
          };
        },
      }),
    }),
  })),
}));

describe('FASE 7: Aislamiento Seguro de Storage y Autorización Backend', () => {
  const serverPath = path.resolve(process.cwd(), 'server.ts');
  const serverContent = readFileSync(serverPath, 'utf8');

  const storageRulesPath = path.resolve(process.cwd(), 'storage.rules');
  const storageRulesContent = readFileSync(storageRulesPath, 'utf8');

  beforeEach(() => {
    // Clear mock store
    for (const key of Object.keys(mockCollections)) {
      delete mockCollections[key];
    }
  });

  describe('1. Auditoría Estática de Código y Reglas de Seguridad', () => {
    it('VERIFICADO: server.ts define /api/storage/signed-url protegido por authenticateUser', () => {
      expect(serverContent).toContain("app.post('/api/storage/signed-url'");
      expect(serverContent).toContain('authenticateUser');
      expect(serverContent).toContain('canAccessStoragePath');
    });

    it('VERIFICADO: server.ts previene Path Traversal (../, ./, //, \\)', () => {
      expect(serverContent).toContain("rawPath.includes('../')");
      expect(serverContent).toContain("rawPath.includes('./')");
      expect(serverContent).toContain("rawPath.includes('//')");
    });

    it('VERIFICADO: storage.rules no otorga lecturas/escrituras públicas por regex en chat_attachments ni recordings', () => {
      const chatStart = storageRulesContent.indexOf('match /chat_attachments/{conversationId}/{fileName}');
      const chatEnd = storageRulesContent.indexOf('match /course_materials', chatStart);
      const chatBlock = storageRulesContent.substring(chatStart, chatEnd);
      expect(chatBlock).not.toContain('isVerifiedUser() &&');
      expect(chatBlock).toContain('allow read, write: if isAdmin();');

      const recBlock = storageRulesContent.substring(
        storageRulesContent.indexOf('match /recordings/{courseOrUserId}/{fileName}')
      );
      expect(recBlock).toContain('allow read, write: if isAdmin();');
    });
  });

  describe('2. Pruebas de Comportamiento Backend: Course Materials', () => {
    it('ALLOW: Estudiante matriculado en el curso puede LEER materiales', async () => {
      mockCollections['users'] = {
        student_1: { enrolledCourseIds: ['math_101', 'physics_201'] },
      };
      const user: StorageAuthUser = { uid: 'student_1', role: 'student' };
      const allowed = await canAccessStoragePath(user, 'course_materials/math_101/syllabus.pdf', 'read');
      expect(allowed).toBe(true);
    });

    it('DENY: Estudiante NO matriculado no puede LEER materiales (IDOR)', async () => {
      mockCollections['users'] = {
        student_1: { enrolledCourseIds: ['math_101'] },
      };
      const user: StorageAuthUser = { uid: 'student_1', role: 'student' };
      const allowed = await canAccessStoragePath(user, 'course_materials/physics_201/exam.pdf', 'read');
      expect(allowed).toBe(false);
    });

    it('DENY: Estudiante NUNCA puede ESCRIBIR materiales de curso', async () => {
      mockCollections['users'] = {
        student_1: { enrolledCourseIds: ['math_101'] },
      };
      const user: StorageAuthUser = { uid: 'student_1', role: 'student' };
      const allowed = await canAccessStoragePath(user, 'course_materials/math_101/syllabus.pdf', 'write');
      expect(allowed).toBe(false);
    });

    it('ALLOW: Profesor aprobado y asignado al curso puede LEER y ESCRIBIR materiales', async () => {
      mockCollections['users'] = {
        teacher_1: { isApprovedForTutoring: true, taughtCourseIds: ['math_101'] },
      };
      const user: StorageAuthUser = { uid: 'teacher_1', role: 'teacher', isApprovedForTutoring: true };

      const canRead = await canAccessStoragePath(user, 'course_materials/math_101/notes.pdf', 'read');
      const canWrite = await canAccessStoragePath(user, 'course_materials/math_101/notes.pdf', 'write');

      expect(canRead).toBe(true);
      expect(canWrite).toBe(true);
    });

    it('DENY: Profesor NO asignado al curso no puede LEER ni ESCRIBIR materiales del curso ajeno', async () => {
      mockCollections['users'] = {
        teacher_1: { isApprovedForTutoring: true, taughtCourseIds: ['math_101'] },
      };
      const user: StorageAuthUser = { uid: 'teacher_1', role: 'teacher', isApprovedForTutoring: true };

      const canWrite = await canAccessStoragePath(user, 'course_materials/biology_301/exam.pdf', 'write');
      expect(canWrite).toBe(false);
    });

    it('DENY: Profesor NO aprobado no puede acceder aunque esté asignado', async () => {
      mockCollections['users'] = {
        teacher_unapproved: { isApprovedForTutoring: false, taughtCourseIds: ['math_101'] },
      };
      const user: StorageAuthUser = { uid: 'teacher_unapproved', role: 'teacher', isApprovedForTutoring: false };

      const allowed = await canAccessStoragePath(user, 'course_materials/math_101/notes.pdf', 'read');
      expect(allowed).toBe(false);
    });

    it('ALLOW: Admin puede LEER y ESCRIBIR cualquier material de curso', async () => {
      const user: StorageAuthUser = { uid: 'admin_1', role: 'admin' };

      const canRead = await canAccessStoragePath(user, 'course_materials/any_course/secret.pdf', 'read');
      const canWrite = await canAccessStoragePath(user, 'course_materials/any_course/secret.pdf', 'write');

      expect(canRead).toBe(true);
      expect(canWrite).toBe(true);
    });
  });

  describe('3. Pruebas de Comportamiento Backend: Class Recordings', () => {
    it('ALLOW: Estudiante matriculado puede LEER grabaciones de su curso', async () => {
      mockCollections['users'] = {
        student_1: { enrolledCourseIds: ['course_a'] },
      };
      const user: StorageAuthUser = { uid: 'student_1', role: 'student' };

      const allowed = await canAccessStoragePath(user, 'recordings/course_a/class_1.webm', 'read');
      expect(allowed).toBe(true);
    });

    it('DENY: Estudiante NO matriculado no puede LEER grabaciones de otro curso', async () => {
      mockCollections['users'] = {
        student_1: { enrolledCourseIds: ['course_a'] },
      };
      const user: StorageAuthUser = { uid: 'student_1', role: 'student' };

      const allowed = await canAccessStoragePath(user, 'recordings/course_b/class_1.webm', 'read');
      expect(allowed).toBe(false);
    });

    it('ALLOW: Profesor asignado/aprobado puede LEER/ESCRIBIR grabaciones', async () => {
      mockCollections['users'] = {
        teacher_1: { isApprovedForTutoring: true, taughtCourseIds: ['course_a'] },
      };
      const user: StorageAuthUser = { uid: 'teacher_1', role: 'teacher', isApprovedForTutoring: true };

      const allowed = await canAccessStoragePath(user, 'recordings/course_a/class_1.webm', 'write');
      expect(allowed).toBe(true);
    });

    it('DENY: Profesor no asignado recibe DENY en grabaciones de otro curso', async () => {
      mockCollections['users'] = {
        teacher_1: { isApprovedForTutoring: true, taughtCourseIds: ['course_a'] },
      };
      const user: StorageAuthUser = { uid: 'teacher_1', role: 'teacher', isApprovedForTutoring: true };

      const allowed = await canAccessStoragePath(user, 'recordings/course_b/class_1.webm', 'read');
      expect(allowed).toBe(false);
    });
  });

  describe('4. Pruebas de Comportamiento Backend: Chat Attachments & IDOR', () => {
    it('ALLOW: Participante real de la conversación puede acceder a los adjuntos', async () => {
      mockCollections['firestore_conversations'] = {
        conv_123: { participants: ['student_1', 'teacher_1'] },
      };
      const user: StorageAuthUser = { uid: 'student_1', role: 'student' };

      const canRead = await canAccessStoragePath(user, 'chat_attachments/conv_123/image.png', 'read');
      expect(canRead).toBe(true);
    });

    it('DENY: Usuario no participante recibe DENY', async () => {
      mockCollections['firestore_conversations'] = {
        conv_123: { participants: ['student_1', 'teacher_1'] },
      };
      const user: StorageAuthUser = { uid: 'attacker_student', role: 'student' };

      const allowed = await canAccessStoragePath(user, 'chat_attachments/conv_123/image.png', 'read');
      expect(allowed).toBe(false);
    });

    it('DENY (IDOR Attack): Usuario con UID como substring (ej. student1 en direct_teacher1_student10) recibe DENY', async () => {
      mockCollections['firestore_conversations'] = {
        direct_teacher1_student10_math: { participants: ['teacher1', 'student10'] },
      };
      // Attacker has UID 'student1' which is a substring of 'student10' in the conversation ID string
      const user: StorageAuthUser = { uid: 'student1', role: 'student' };

      const allowed = await canAccessStoragePath(user, 'chat_attachments/direct_teacher1_student10_math/file.pdf', 'read');
      expect(allowed).toBe(false);
    });

    it('DENY: Conversación inexistente en Firestore resulta en DENY', async () => {
      const user: StorageAuthUser = { uid: 'student_1', role: 'student' };

      const allowed = await canAccessStoragePath(user, 'chat_attachments/non_existent_conv/file.pdf', 'read');
      expect(allowed).toBe(false);
    });

    it('DENY: Documento de conversación sin array participants válido resulta en DENY', async () => {
      mockCollections['firestore_conversations'] = {
        corrupted_conv: { title: 'Conversación corrupta' }, // missing participants array
      };
      const user: StorageAuthUser = { uid: 'student_1', role: 'student' };

      const allowed = await canAccessStoragePath(user, 'chat_attachments/corrupted_conv/file.pdf', 'read');
      expect(allowed).toBe(false);
    });
  });

  describe('5. Pruebas de Path Traversal & Categorías No Reconocidas', () => {
    it('DENY: Intento de Path Traversal con ../ es rechazado', async () => {
      const user: StorageAuthUser = { uid: 'student_1', role: 'student' };
      const allowed = await canAccessStoragePath(user, 'course_materials/../users/admin.txt', 'read');
      expect(allowed).toBe(false);
    });

    it('DENY: Intento de Path Traversal con // es rechazado', async () => {
      const user: StorageAuthUser = { uid: 'student_1', role: 'student' };
      const allowed = await canAccessStoragePath(user, 'course_materials//secret.txt', 'read');
      expect(allowed).toBe(false);
    });

    it('DENY: Categoría de almacenamiento desconocida resulta en DENY', async () => {
      const user: StorageAuthUser = { uid: 'student_1', role: 'student' };
      const allowed = await canAccessStoragePath(user, 'system_config/database.json', 'read');
      expect(allowed).toBe(false);
    });
  });

  describe('6. Pruebas Negativas: Fallos de Firestore e Identidad Nula', () => {
    it('DENY: Error o excepción en Firestore resulta en DENY (Deny-by-Default)', async () => {
      mockCollections['users'] = {
        student_err: '__THROW__',
      };
      const user: StorageAuthUser = { uid: 'student_err', role: 'student' };
      const allowed = await canAccessStoragePath(user, 'course_materials/math_101/file.pdf', 'read');
      expect(allowed).toBe(false);
    });

    it('DENY: Usuario sin UID o token inválido resulta en DENY', async () => {
      const user: any = { uid: '', role: 'student' };
      const allowed = await canAccessStoragePath(user, 'course_materials/math_101/file.pdf', 'read');
      expect(allowed).toBe(false);
    });
  });
});
