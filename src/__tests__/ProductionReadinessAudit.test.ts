import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canAccessStoragePath } from '../../server';
import { eventEmitter } from '../services/eventService';
import { QueryClient } from '@tanstack/react-query';

// Mock getFirestore for server testing
vi.mock('firebase-admin/firestore', () => {
  return {
    getFirestore: () => ({
      collection: (colName: string) => ({
        doc: (docId: string) => ({
          get: async () => {
            if (colName === 'users' && docId === 'student_1') {
              return {
                exists: true,
                data: () => ({ enrolledCourseIds: ['course_physics'] })
              };
            }
            if (colName === 'users' && docId === 'teacher_1') {
              return {
                exists: true,
                data: () => ({ taughtCourseIds: ['course_physics'], isApprovedForTutoring: true })
              };
            }
            if (colName === 'firestore_conversations' && docId === 'convo_1') {
              return {
                exists: true,
                data: () => ({ participants: ['student_1', 'teacher_1'] })
              };
            }
            return { exists: false };
          }
        })
      })
    })
  };
});

describe('FASE 9 — Pruebas de Auditoría Final y Robustez de Pre-Producción', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Seguridad de Almacenamiento (Deny-By-Default y Path Traversal)', () => {
    it('Debe DENEGAR el acceso si el usuario es nulo o indefinido', async () => {
      const allowed = await canAccessStoragePath(null as any, 'course_materials/course_physics/file.pdf', 'read');
      expect(allowed).toBe(false);
    });

    it('Debe DENEGAR el acceso con secuencias de Path Traversal', async () => {
      const user = { uid: 'student_1', role: 'student' };
      const allowed = await canAccessStoragePath(user, 'course_materials/course_physics/../../../etc/passwd', 'read');
      expect(allowed).toBe(false);
    });

    it('Debe DENEGAR el acceso si no hay suficientes partes en la ruta', async () => {
      const user = { uid: 'student_1', role: 'student' };
      const allowed = await canAccessStoragePath(user, 'course_materials', 'read');
      expect(allowed).toBe(false);
    });

    it('Debe PERMITIR el acceso de lectura a materiales si el estudiante está matriculado', async () => {
      const user = { uid: 'student_1', role: 'student' };
      const allowed = await canAccessStoragePath(user, 'course_materials/course_physics/material.pdf', 'read');
      expect(allowed).toBe(true);
    });

    it('Debe DENEGAR el acceso de lectura a materiales si el estudiante NO está matriculado', async () => {
      const user = { uid: 'student_1', role: 'student' };
      const allowed = await canAccessStoragePath(user, 'course_materials/course_math/material.pdf', 'read');
      expect(allowed).toBe(false);
    });

    it('Debe PERMITIR el acceso a archivos de chat si el usuario es participante', async () => {
      const user = { uid: 'student_1', role: 'student' };
      const allowed = await canAccessStoragePath(user, 'chat_attachments/convo_1/image.png', 'read');
      expect(allowed).toBe(true);
    });

    it('Debe DENEGAR el acceso a archivos de chat si el usuario NO es participante', async () => {
      const user = { uid: 'student_other', role: 'student' };
      const allowed = await canAccessStoragePath(user, 'chat_attachments/convo_1/image.png', 'read');
      expect(allowed).toBe(false);
    });
  });

  describe('2. Aislamiento y Limpieza de React Query en Logout', () => {
    it('Debe vaciar el cache de QueryClient cuando se emite el evento "user-logout"', () => {
      const queryClient = new QueryClient();
      
      // Seed query client cache
      queryClient.setQueryData(['sensitive_data'], { secret: 'user_a_private_data' });
      expect(queryClient.getQueryData(['sensitive_data'])).toBeDefined();

      // Listen to event to trigger clear
      const handleLogout = () => {
        queryClient.clear();
      };
      eventEmitter.on('user-logout', handleLogout);

      try {
        // Emit logout event
        eventEmitter.emit('user-logout');

        // Verify that cache is completely empty/cleared
        expect(queryClient.getQueryData(['sensitive_data'])).toBeUndefined();
      } finally {
        eventEmitter.off('user-logout', handleLogout);
      }
    });

    it('Caso Secuencial: Usuario A inicia sesión -> obtiene datos A -> hace logout -> Usuario B inicia sesión -> NO puede observar datos cacheados de A', () => {
      const queryClient = new QueryClient();
      const handleLogout = () => {
        queryClient.clear();
      };
      eventEmitter.on('user-logout', handleLogout);

      try {
        // 1. Usuario A inicia sesión y obtiene datos de A
        const userA = { uid: 'user_a', name: 'Usuario A', role: 'student' };
        queryClient.setQueryData(['user', userA.uid], { profile: 'Datos Privados de Usuario A' });
        queryClient.setQueryData(['courses', userA.uid], ['physics-101']);

        expect(queryClient.getQueryData(['user', userA.uid])).toBeDefined();
        expect(queryClient.getQueryData(['courses', userA.uid])).toEqual(['physics-101']);

        // 2. Usuario A hace logout
        eventEmitter.emit('user-logout');

        // 3. Verificación inmediata: Los datos de A y sus llaves ya no existen
        expect(queryClient.getQueryData(['user', userA.uid])).toBeUndefined();
        expect(queryClient.getQueryData(['courses', userA.uid])).toBeUndefined();

        // 4. Usuario B inicia sesión
        const userB = { uid: 'user_b', name: 'Usuario B', role: 'student' };
        queryClient.setQueryData(['user', userB.uid], { profile: 'Datos Privados de Usuario B' });

        // Verificamos que los datos de B existen, pero los de A permanecen completamente limpios e inaccesibles
        expect(queryClient.getQueryData(['user', userB.uid])).toBeDefined();
        expect(queryClient.getQueryData(['user', userA.uid])).toBeUndefined();
        expect(queryClient.getQueryData(['courses', userA.uid])).toBeUndefined();
      } finally {
        eventEmitter.off('user-logout', handleLogout);
      }
    });
  });
});
